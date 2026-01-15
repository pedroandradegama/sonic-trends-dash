-- Delete invalid PubMed articles with non-existent IDs
DELETE FROM ultrasound_articles WHERE url LIKE '%pubmed.ncbi.nlm.nih.gov/4%';