-- Create todos table
CREATE TABLE todos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    completed BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create index on completed status for faster queries
CREATE INDEX idx_todos_completed ON todos(completed);

-- Create index on created_at for sorting
CREATE INDEX idx_todos_created_at ON todos(created_at);
