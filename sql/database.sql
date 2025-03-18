CREATE TABLE json_data
(
    id            INT PRIMARY KEY,
    json_data     TEXT DEFAULT NULL,
    creation_date TIMESTAMP DEFAULT NOW(),
    json_date     TIMESTAMP DEFAULT NULL
);

CREATE SEQUENCE json_data_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER TABLE public.json_data_id_seq OWNER TO exalog;
ALTER SEQUENCE json_data_id_seq OWNED BY json_data.id;
ALTER TABLE json_data ALTER COLUMN id SET DEFAULT nextval('json_data_id_seq'::regclass);

GRANT SELECT, UPDATE, DELETE, INSERT ON json_data        TO exalog;
GRANT SELECT, UPDATE                 ON json_data_id_seq TO exalog;

