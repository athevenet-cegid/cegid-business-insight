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

// Function to generate wheat price data
function generateWheatPriceData() {
  const data = []
  const months = ["Apr", "May", "Jun", "Jul", "Aug", "Sep"]
  const basePrice = 280 // Base price in euros

  // Generate data with increasing prices (18-22% increase over 90 days)
  for (let i = 0; i < months.length; i++) {
    let projectedPrice

    if (i === 0) {
      // First month - same as base price
      projectedPrice = basePrice
    } else if (i === 3) {
      // Peak in July (4th month)
      projectedPrice = Math.round(basePrice * 1.22)
    } else if (i > 3) {
      // Slight decrease after peak
      projectedPrice = Math.round(basePrice * (1.22 - (i - 3) * 0.01))
    } else {
      // Gradual increase
      projectedPrice = Math.round(basePrice * (1 + i * 0.07))
    }

    data.push({
      month: months[i],
      current: basePrice,
      projected: projectedPrice,
    })
  }

  return data
}

// Function to create wheat price chart
function createWheatPriceChart(data) {
  const ctx = document.getElementById("wheatPriceChart").getContext("2d")

  // Create gradient for bars
  const currentGradient = ctx.createLinearGradient(0, 0, 0, 400)
  currentGradient.addColorStop(0, "rgba(99, 102, 241, 0.8)")
  currentGradient.addColorStop(1, "rgba(99, 102, 241, 0.3)")

  const projectedGradient = ctx.createLinearGradient(0, 0, 0, 400)
  projectedGradient.addColorStop(0, "rgba(239, 68, 68, 0.8)")
  projectedGradient.addColorStop(1, "rgba(239, 68, 68, 0.3)")

  const chart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: data.map((item) => item.month),
      datasets: [
        {
          label: "Current Price",
          data: data.map((item) => item.current),
          backgroundColor: currentGradient,
          borderColor: "rgba(99, 102, 241, 1)",
          borderWidth: 1,
        },
        {
          label: "Historic Price",
          data: data.map((item) => item.projected),
          backgroundColor: projectedGradient,
          borderColor: "rgba(239, 68, 68, 1)",
          borderWidth: 1,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          ticks: {
            callback: (value) => "€" + value,
          },
          min: 0,
          max: 400,
        },
      },
      plugins: {
        tooltip: {
          callbacks: {
            label: (context) => context.dataset.label + ": €" + context.raw,
          },
        },
      },
    },
  })

  return chart
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
  $("#ai-modal-body").animate({ scrollTop: $('#ai-modal-body').prop("scrollHeight")}, 500);
  
  // After a delay, start chart analysis
  setTimeout(() => {
    $('#chartMessage').fadeIn(500);
    $('#chartLoading').fadeIn(300);
    $("#ai-modal-body").animate({ scrollTop: $('#ai-modal-body').prop("scrollHeight")}, 500);
    
    // After loading, show the chart
    setTimeout(() => {
      $('#chartLoading').fadeOut(300, () => {
        $('#chartContainer').fadeIn(500);
        $("#ai-modal-body").animate({ scrollTop: $('#ai-modal-body').prop("scrollHeight")}, 500);
        
        // Initialize the chart
        const wheatPriceData = generateWheatPriceData();
        createWheatPriceChart(wheatPriceData);
        
        // After chart is shown, load data sources
        setTimeout(() => {
          $('#sourcesMessage').fadeIn(500);
          $('#sourcesLoading').fadeIn(300);
          $("#ai-modal-body").animate({ scrollTop: $('#ai-modal-body').prop("scrollHeight")}, 500);
          
          // Load sources one by one
          const sources = [
            "90-day wheat price forecasts (World Bank, Euronext)",
            "Geopolitical risk assessment affecting the wheat market (Reuters, Financial Times)"
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
                  $("#ai-modal-body").animate({ scrollTop: $('#ai-modal-body').prop("scrollHeight")}, 500);
                  
                  // Start data extraction phase
                  setTimeout(() => {
                    $('#analysisMessage').fadeIn(500);
                    $('#analysisLoading').fadeIn(300);
                    $("#ai-modal-body").animate({ scrollTop: $('#ai-modal-body').prop("scrollHeight")}, 500);
                    
                    // After extraction, show findings
                    setTimeout(() => {
                      $('#analysisLoading').fadeOut(300, () => {
                        $('#analysisFindings').fadeIn(500);
                        $("#ai-modal-body").animate({ scrollTop: $('#ai-modal-body').prop("scrollHeight")}, 500);
                        
                        // Show scenarios
                        setTimeout(() => {
                          $('#scenariosMessage').fadeIn(500);
                          $("#ai-modal-body").animate({ scrollTop: $('#ai-modal-body').prop("scrollHeight")}, 500);
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
