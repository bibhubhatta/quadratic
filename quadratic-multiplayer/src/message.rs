use std::sync::Arc;

use anyhow::{anyhow, Result};
use axum::extract::ws::{Message, WebSocket};
use futures_util::stream::SplitSink;
use futures_util::SinkExt;
use serde::{Deserialize, Serialize};
use tokio::sync::Mutex;
use uuid::Uuid;

use crate::state::{Room, State, User};

#[derive(Deserialize, Debug)]
#[serde(tag = "type")]
pub(crate) enum MessageRequest {
    EnterRoom {
        user_id: Uuid,
        file_id: Uuid,
        first_name: String,
        last_name: String,
        image: String,
    },
    MouseMove {
        user_id: Uuid,
        file_id: Uuid,
        x: f64,
        y: f64,
    },
}

#[derive(Serialize, Debug)]
#[serde(tag = "type")]
pub(crate) enum MessageResponse {
    Room {
        room: Room,
    },
    MouseMove {
        user_id: Uuid,
        file_id: Uuid,
        x: f64,
        y: f64,
    },
}

pub(crate) async fn handle_message(
    request: MessageRequest,
    state: Arc<State>,
    sender: Arc<Mutex<SplitSink<WebSocket, Message>>>,
) -> Result<MessageResponse> {
    tracing::trace!("Handling message {:?}", request);

    match request {
        // User enters a room.  If the room doesn't exist, it is created.
        // Users can only be added to a room once
        MessageRequest::EnterRoom {
            user_id,
            file_id,
            first_name,
            last_name,
            image,
        } => {
            let user = User {
                id: user_id,
                first_name,
                last_name,
                image,
                socket: Arc::clone(&sender),
            };

            let is_new = state.enter_room(file_id, user).await;

            let room = state
                .rooms
                .lock()
                .await
                .get(&file_id)
                .ok_or(anyhow!("Room {file_id} not found"))?
                .clone();

            let response = MessageResponse::Room { room };

            // only broadcast if the user is new to the room
            if is_new {
                broadcast(user_id, file_id, Arc::clone(&state), &response).await?;
            }

            Ok(response)
        }

        // User moves their mouse
        MessageRequest::MouseMove {
            user_id,
            file_id,
            x,
            y,
        } => {
            let response = MessageResponse::MouseMove { user_id, x, y };

            broadcast(user_id, Uuid::nil(), Arc::clone(&state), &response).await?;

            Ok(response)
        }
    }
}

pub(crate) async fn broadcast(
    user_id: Uuid,
    file_id: Uuid,
    state: Arc<State>,
    message: &MessageResponse,
) -> Result<()> {
    let room = state
        .rooms
        .lock()
        .await
        .get(&file_id)
        .ok_or(anyhow!("Room {file_id} not found"))?
        .clone();

    for (_, user) in room.users.iter().filter(|user| user.0 != &user_id) {
        (*user.socket.lock().await)
            .send(Message::Text(serde_json::to_string(&message)?))
            .await?;
    }

    Ok(())
}
