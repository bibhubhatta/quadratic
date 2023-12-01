//! Shared State
//!
//! Store information about the state of the application in a send + sync
//! struct.  All access and mutations to state should be performed here.

use std::{collections::HashMap, sync::Arc};

use axum::extract::ws::{Message, WebSocket};
use futures_util::stream::SplitSink;
use serde::Serialize;
use tokio::sync::Mutex;
use uuid::Uuid;

#[derive(Serialize, Debug, Clone)]
pub(crate) struct User {
    #[serde(skip_serializing)]
    pub(crate) id: Uuid,
    pub(crate) first_name: String,
    pub(crate) last_name: String,
    pub(crate) image: String,
    #[serde(skip_serializing)]
    pub(crate) socket: Arc<Mutex<SplitSink<WebSocket, Message>>>,
}

#[derive(Serialize, Debug, Clone)]
pub(crate) struct Room {
    pub(crate) file_id: Uuid,
    pub(crate) users: HashMap<Uuid, User>,
}

#[derive(Debug)]
pub(crate) struct State {
    pub(crate) rooms: Mutex<HashMap<Uuid, Room>>,
}

impl State {
    pub(crate) fn new() -> Self {
        State {
            rooms: Mutex::new(HashMap::new()),
        }
    }

    /// Add a user to a room.  If the room doesn't exist, it is created.  Users
    /// are only added to a room once (HashMap).
    pub(crate) async fn enter_room(&self, file_id: Uuid, user: User) -> bool {
        let mut rooms = self.rooms.lock().await;
        let room = rooms.entry(file_id).or_insert_with(|| Room {
            file_id,
            users: HashMap::new(),
        });

        tracing::trace!("User {:?} entered room {:?}", user, room);

        room.users.insert(user.id, user).is_none()
    }
}
