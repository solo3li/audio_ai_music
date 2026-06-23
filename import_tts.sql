\copy "Dialects"("Id", "Name", "Value", "IsPremium", "IsActive", "Order") FROM '/tmp/dialects.csv' WITH CSV HEADER;
\copy "Emotions"("Id", "Name", "Value", "IsPremium", "IsActive", "Order") FROM '/tmp/emotions.csv' WITH CSV HEADER;
\copy "Styles"("Id", "Name", "Value", "IsPremium", "IsActive", "Order") FROM '/tmp/styles.csv' WITH CSV HEADER;
\copy "Voices"("Id", "Name", "VoiceName", "Accent", "Gender", "IsPremium", "IsActive", "DemoAudio", "Order", "GeminiVoice") FROM '/tmp/voices.csv' WITH CSV HEADER;

SELECT setval(pg_get_serial_sequence('"Dialects"', 'Id'), coalesce(max("Id"),0) + 1, false) FROM "Dialects";
SELECT setval(pg_get_serial_sequence('"Emotions"', 'Id'), coalesce(max("Id"),0) + 1, false) FROM "Emotions";
SELECT setval(pg_get_serial_sequence('"Styles"', 'Id'), coalesce(max("Id"),0) + 1, false) FROM "Styles";
SELECT setval(pg_get_serial_sequence('"Voices"', 'Id'), coalesce(max("Id"),0) + 1, false) FROM "Voices";
