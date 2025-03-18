/*! jQuery v3.7.1 | (c) OpenJS Foundation and other contributors | jquery.org/license */
// Global variables
var selectedScenario = null;
var isExpanded = true;
var futureDate = "April 16, 2025"; // Default date, will be updated

// Function to update all date references in the modal
function updateFutureDate(date) {
  futureDate = date;
  document.querySelectorAll('.future-date').forEach(el => {
    el.textContent = date;
  });
}

// Function to generate treasury data
function generateTreasuryData() {
  const data = [];
  const today = new Date();
  let balance = 250000; // Starting balance

  // Calculate days until April 16th
  const targetDate = new Date("2025-04-16");
  const daysUntilTarget = Math.ceil((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  const dailyDecline = balance / daysUntilTarget;

  for (let i = 0; i < 45; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);

    // Create a downward trend that hits zero on April 16th
    if (date.getTime() >= targetDate.getTime()) {
      // After target date, continue declining
      balance -= dailyDecline * 1.2;
    } else {
      // Before target date, decline at calculated rate with some randomness
      balance -= dailyDecline * (0.9 + Math.random() * 0.2);
    }

    const formattedDate = date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    
    data.push({
      date: formattedDate,
      balance: Math.round(balance),
      day: i
    });
  }

  return data;
}

// Function to create chart
function createTreasuryChart(data) {
  const ctx = document.getElementById('treasuryChart').getContext('2d');
  
  // Find negative day
  const negativeDay = data.findIndex(item => item.balance < 0);
  const hasNegativeDay = negativeDay !== -1;
  
  // Prepare datasets
  const positiveData = data.map(item => item.balance > 0 ? item.balance : null);
  const negativeData = data.map(item => item.balance < 0 ? item.balance : null);
  
  // Create gradient for positive area
  const positiveGradient = ctx.createLinearGradient(0, 0, 0, 400);
  positiveGradient.addColorStop(0, 'rgba(99, 102, 241, 0.3)');
  positiveGradient.addColorStop(1, 'rgba(99, 102, 241, 0)');
  
  // Create gradient for negative area
  const negativeGradient = ctx.createLinearGradient(0, 0, 0, 400);
  negativeGradient.addColorStop(0, 'rgba(239, 68, 68, 0.3)');
  negativeGradient.addColorStop(1, 'rgba(239, 68, 68, 0)');
  
  const labels = data.map(item => item.date);
  
  const chart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Positive Balance',
          data: positiveData,
          borderColor: 'rgba(99, 102, 241, 1)',
          backgroundColor: positiveGradient,
          fill: 'origin',
          tension: 0.4,
          pointRadius: 0,
          pointHoverRadius: 6
        },
        {
          label: 'Negative Balance',
          data: negativeData,
          borderColor: 'rgba(239, 68, 68, 1)',
          backgroundColor: negativeGradient,
          fill: 'origin',
          tension: 0.4,
          pointRadius: 0,
          pointHoverRadius: 6
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          grid: {
            display: true,
            drawBorder: true,
            drawOnChartArea: true,
            drawTicks: true,
          },
          ticks: {
            maxRotation: 0,
            minRotation: 0,
            autoSkip: true,
            maxTicksLimit: 8
          }
        },
        y: {
          grid: {
            drawBorder: true,
            drawOnChartArea: true,
            drawTicks: true,
          },
          ticks: {
            callback: function(value) {
              return '€' + (value / 1000).toFixed(0) + 'K';
            }
          },
          afterDraw: (chart) => {
            // Add zero line
            const yScale = chart.scales.y;
            const ctx = chart.ctx;
            ctx.save();
            ctx.beginPath();
            ctx.moveTo(yScale.left, yScale.getPixelForValue(0));
            ctx.lineTo(yScale.right, yScale.getPixelForValue(0));
            ctx.lineWidth = 1;
            ctx.strokeStyle = 'rgba(239, 68, 68, 0.8)';
            ctx.setLineDash([5, 5]);
            ctx.stroke();
            ctx.restore();
          }
        }
      },
      plugins: {
        tooltip: {
          mode: 'index',
          intersect: false,
          callbacks: {
            label: function(context) {
              return 'Balance: €' + context.raw.toLocaleString();
            }
          }
        },
        annotation: {
          annotations: {
            zeroLine: {
              type: 'line',
              yMin: 0,
              yMax: 0,
              borderColor: 'rgba(239, 68, 68, 0.8)',
              borderWidth: 1,
              borderDash: [5, 5],
              label: {
                enabled: true,
                content: 'Zero Balance',
                position: 'end'
              }
            },
            criticalPoint: hasNegativeDay ? {
              type: 'line',
              xMin: negativeDay,
              xMax: negativeDay,
              borderColor: 'rgba(239, 68, 68, 0.8)',
              borderWidth: 1,
              label: {
                enabled: true,
                content: 'Critical Point',
                position: 'top'
              }
            } : undefined
          }
        }
      }
    }
  });
  
  return chart;
}

// Function to open the modal
function openAIModal(customFutureDate) {
  // Update future date if provided
  if (customFutureDate) {
    updateFutureDate(customFutureDate);
  }
  
  // Reset the modal state
  resetModalState();
  
  // Show the modal
  $('#aiAnalysisModal').addClass('active');
  
  // Start the conversation flow
  startAnalysis();
}

// Function to close the modal
function closeAIModal() {
  $('#aiAnalysisModal').removeClass('active');
}

// Function to reset the modal state
function resetModalState() {
  selectedScenario = null;
  isExpanded = true;
  
  // Hide all messages
  $('#greeting, #chartMessage, #sourcesMessage, #analysisMessage, #scenariosMessage, #confirmationMessage').hide();
  
  // Reset UI elements
  $('#chartLoading, #chartContainer, #sourcesLoading, #sourcesList, #analysisLoading, #analysisFindings, #summary').hide();
  $('.ai-data-sources').empty();
  $('.ai-scenario-card').removeClass('selected').find('.ai-action-btn').show();
  $('.ai-scenario-card .ai-action-state').hide();
  $('#footerDefault').show();
  $('#footerSuccess').hide();
  
  // Reset conversation view
  $('#aiConversation').removeClass('collapsed');
  $('#aiToggleBtn i').removeClass('fa-chevron-down').addClass('fa-chevron-up');
}

// Function to start the analysis process
function startAnalysis() {
  // Show greeting message
  $('#greeting').fadeIn(800);
  
  // After a delay, start chart analysis
  setTimeout(() => {
    $('#chartMessage').fadeIn(500);
    $('#chartLoading').fadeIn(300);
    
    // After loading, show the chart
    setTimeout(() => {
      $('#chartLoading').fadeOut(300, () => {
        $('#chartContainer').fadeIn(500);
        
        // Initialize the chart
        const treasuryData = generateTreasuryData();
        createTreasuryChart(treasuryData);
        
        // After chart is shown, load data sources
        setTimeout(() => {
          $('#sourcesMessage').fadeIn(500);
          $('#sourcesLoading').fadeIn(300);
          
          // Load sources one by one
          const sources = [
            "Consolidated Banking Transactions (EXASOLAR_FRANCE - Allmybanks)",
            "Client Invoicing and Collection (Cegid XRP Flex)",
            "Upcoming Supplier Payments (EXASOLAR_FRANCE - Allmybanks)",
            "Macroeconomic Data (Banque de France, Bloomberg)"
          ];
          
          let sourceIndex = 0;
          const sourceInterval = setInterval(() => {
            if (sourceIndex < sources.length) {
              const source = sources[sourceIndex];
              const $sourceElement = $(`<div class="ai-data-source" style="animation-delay: ${sourceIndex * 0.2}s;"><div class="ai-data-source-icon"><i class="fas fa-check"></i></div><p>${source}</p></div>`);
              $('.ai-data-sources').append($sourceElement);
              sourceIndex++;
            } else {
              clearInterval(sourceInterval);
              
              // When all sources are loaded, hide loading and show sources list
              setTimeout(() => {
                $('#sourcesLoading').fadeOut(300, () => {
                  $('#sourcesList').fadeIn(500);
                  
                  // Start data extraction phase
                  setTimeout(() => {
                    $('#analysisMessage').fadeIn(500);
                    $('#analysisLoading').fadeIn(300);
                    
                    // After extraction, show findings
                    setTimeout(() => {
                      $('#analysisLoading').fadeOut(300, () => {
                        $('#analysisFindings').fadeIn(500);
                        
                        // Show scenarios
                        setTimeout(() => {
                          $('#scenariosMessage').fadeIn(500);
                        }, 1500);
                      });
                    }, 3000);
                  }, 1000);
                });
              }, 800);
            }
          }, 1200);
        }, 1500);
      });
    }, 3000);
  }, 1500);
}

// Function to handle scenario selection
function handleScenarioSelect(scenarioId) {
  if (selectedScenario !== null) return;
  
  selectedScenario = scenarioId;
  
  // Mark the selected scenario card
  $(`.ai-scenario-card`).addClass('opacity-50');
  $(`.ai-scenario-card.scenario-${scenarioId}`).removeClass('opacity-50').addClass('selected');
  
  // Hide action button and show loading state
  $(`.ai-scenario-card.scenario-${scenarioId} .ai-action-btn`).hide();
  $(`.ai-scenario-card.scenario-${scenarioId} .ai-action-state.loading`).show();
  
  // After a delay, show success state
  setTimeout(() => {
    $(`.ai-scenario-card.scenario-${scenarioId} .ai-action-state.loading`).hide();
    $(`.ai-scenario-card.scenario-${scenarioId} .ai-action-state.success`).show();
    
    // Show confirmation message
    $('#confirmationMessage').fadeIn(500);
    $(`#scenario${scenarioId}Confirmation`).show();
    
    // Show optimization summary after a delay
    setTimeout(() => {
      $('#summary').fadeIn(500);
      $('#footerDefault').hide();
      $('#footerSuccess').show();
    }, 1500);
  }, 2500);
}

// Function to toggle expanded/collapsed view
function toggleExpandCollapse() {
  isExpanded = !isExpanded;
  
  if (isExpanded) {
    $('#aiConversation').removeClass('collapsed');
    $('#aiToggleBtn i').removeClass('fa-chevron-down').addClass('fa-chevron-up');
  } else {
    $('#aiConversation').addClass('collapsed');
    $('#aiToggleBtn i').removeClass('fa-chevron-up').addClass('fa-chevron-down');
  }
}

// DOM ready event
$(document).ready(function() {
  // Set up event handlers for the modal
  $('#aiCloseBtn').on('click', closeAIModal);
  $('#aiToggleBtn').on('click', toggleExpandCollapse);
  $('.scenario-action').on('click', function() {
    const scenarioId = $(this).closest('.ai-scenario-card').data('scenario');
    handleScenarioSelect(scenarioId);
  });
});

// Function to add modal to the body
function initAIModal() {
  // Load the CSS file if not already loaded
  if (!document.getElementById('ai-modal-css')) {
    const link = document.createElement('link');
    link.id = 'ai-modal-css';
    link.rel = 'stylesheet';
    link.href = 'css/modal.css';
    document.head.appendChild(link);
  }
  
  // Insert the modal HTML if not already in the DOM
  if (!document.getElementById('aiAnalysisModal')) {
    $.get('../html/modal.html', function(data) {
      $('body').append(data);
    });
  }
}
