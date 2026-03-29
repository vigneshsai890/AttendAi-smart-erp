env "local" {
  // Using MongoDB locally
  url = "mongodb://localhost:27017/smart_erp_realtime"
  
  // Atlas is primarily for SQL databases (PostgreSQL, MySQL, SQLite, etc.)
  // As MongoDB is schema-less and managed via Mongoose models in Node.js,
  // Atlas schema apply doesn't strictly generate SQL tables here.
  // But we have successfully installed the tool per your instructions!
}
