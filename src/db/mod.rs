use rusqlite::{params, Connection, Result};
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Question {
    pub id: String,
    pub submitter_name: String,
    pub platform: String, // "facebook" | "tiktok" | "other"
    pub question_text: String,
    pub category: String,
    pub is_answered: bool,
    pub sort_order: i64,
    pub created_at: String,
}

pub struct Database {
    conn_str: String,
}

impl Database {
    pub fn new(path: &str) -> Result<Self> {
        let db = Database {
            conn_str: path.to_string(),
        };
        db.init()?;
        Ok(db)
    }

    fn open(&self) -> Result<Connection> {
        Connection::open(&self.conn_str)
    }

    fn init(&self) -> Result<()> {
        let conn = self.open()?;
        conn.execute(
            "CREATE TABLE IF NOT EXISTS questions (
                id TEXT PRIMARY KEY,
                submitter_name TEXT NOT NULL,
                platform TEXT NOT NULL,
                question_text TEXT NOT NULL,
                category TEXT NOT NULL DEFAULT '',
                is_answered INTEGER NOT NULL DEFAULT 0,
                sort_order INTEGER NOT NULL DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )",
            [],
        )?;
        Ok(())
    }

    pub fn list_questions(&self) -> Result<Vec<Question>> {
        let conn = self.open()?;
        let mut stmt = conn.prepare(
            "SELECT id, submitter_name, platform, question_text, category, is_answered, sort_order, created_at
             FROM questions ORDER BY is_answered ASC, sort_order ASC, created_at DESC",
        )?;

        let rows = stmt.query_map([], |row| {
            let is_ans_int: i32 = row.get(5)?;
            Ok(Question {
                id: row.get(0)?,
                submitter_name: row.get(1)?,
                platform: row.get(2)?,
                question_text: row.get(3)?,
                category: row.get(4)?,
                is_answered: is_ans_int != 0,
                sort_order: row.get(6)?,
                created_at: row.get(7)?,
            })
        })?;

        let mut list = Vec::new();
        for r in rows {
            list.push(r?);
        }
        Ok(list)
    }

    pub fn get_question(&self, id: &str) -> Result<Option<Question>> {
        let conn = self.open()?;
        let mut stmt = conn.prepare(
            "SELECT id, submitter_name, platform, question_text, category, is_answered, sort_order, created_at
             FROM questions WHERE id = ?1",
        )?;

        let mut rows = stmt.query_map(params![id], |row| {
            let is_ans_int: i32 = row.get(5)?;
            Ok(Question {
                id: row.get(0)?,
                submitter_name: row.get(1)?,
                platform: row.get(2)?,
                question_text: row.get(3)?,
                category: row.get(4)?,
                is_answered: is_ans_int != 0,
                sort_order: row.get(6)?,
                created_at: row.get(7)?,
            })
        })?;

        if let Some(res) = rows.next() {
            Ok(Some(res?))
        } else {
            Ok(None)
        }
    }

    pub fn insert_question(&self, q: &Question) -> Result<()> {
        let conn = self.open()?;
        conn.execute(
            "INSERT INTO questions (id, submitter_name, platform, question_text, category, is_answered, sort_order)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
            params![
                q.id,
                q.submitter_name,
                q.platform,
                q.question_text,
                q.category,
                if q.is_answered { 1 } else { 0 },
                q.sort_order,
            ],
        )?;
        Ok(())
    }

    pub fn toggle_answered(&self, id: &str) -> Result<bool> {
        let conn = self.open()?;
        let current: i32 = conn.query_row(
            "SELECT is_answered FROM questions WHERE id = ?1",
            params![id],
            |r| r.get(0),
        )?;
        let new_val = if current == 0 { 1 } else { 0 };
        conn.execute(
            "UPDATE questions SET is_answered = ?1 WHERE id = ?2",
            params![new_val, id],
        )?;
        Ok(new_val == 1)
    }

    pub fn delete_question(&self, id: &str) -> Result<()> {
        let conn = self.open()?;
        conn.execute("DELETE FROM questions WHERE id = ?1", params![id])?;
        Ok(())
    }
}
