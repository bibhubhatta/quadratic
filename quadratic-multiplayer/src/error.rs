//! Error Handling
//!
//! Create a generic Result type to reduce boilerplate.
//! Define errors used in the application.
//! Convert third party crate errors to application errors.
//! Convert errors to responses.

use serde::{Deserialize, Serialize};
use thiserror::Error;

pub(crate) type Result<T> = std::result::Result<T, MpError>;

#[derive(Error, Debug, Serialize, Deserialize, PartialEq, Clone)]
pub(crate) enum MpError {
    #[error("Authentication error: {0}")]
    Authentication(String),

    #[error("Background service error: {0}")]
    BackgroundService(String),

    #[error("Internal server error: {0}")]
    Config(String),

    #[error("Connection error: {0}")]
    Connection(String),

    #[error("File permissions error: {0}")]
    FilePermissions(bool, String),

    #[error("File service error: {0}")]
    FileService(String),

    #[error("Internal server error: {0}")]
    InternalServer(String),

    #[error("Error requesting data: {0}")]
    Request(String),

    #[error("Room error: {0}")]
    Room(String),

    #[error("Error in S3: {0}")]
    S3(String),

    #[error("Error sending message: {0}")]
    SendingMessage(String),

    #[error("Error serializing or deserializing: {0}")]
    Serialization(String),

    #[error("Transaction queue error: {0}")]
    TransactionQueue(String),

    #[error("unknown error: {0}")]
    Unknown(String),

    #[error("User error: {0}")]
    User(String),
}

impl From<serde_json::Error> for MpError {
    fn from(error: serde_json::Error) -> Self {
        MpError::Serialization(error.to_string())
    }
}

impl From<uuid::Error> for MpError {
    fn from(error: uuid::Error) -> Self {
        MpError::Unknown(error.to_string())
    }
}

impl From<reqwest::Error> for MpError {
    fn from(error: reqwest::Error) -> Self {
        MpError::Request(error.to_string())
    }
}

impl From<jsonwebtoken::errors::Error> for MpError {
    fn from(error: jsonwebtoken::errors::Error) -> Self {
        MpError::Authentication(error.to_string())
    }
}
