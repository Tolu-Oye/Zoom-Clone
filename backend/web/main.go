// main.go
package main

import (
    "fmt"
    "log"
    "net/http"
    "github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

var (
	clients      = make(map[*websocket.Conn]bool)
	clientsMutex sync.Mutex
)

func handleConnections(w http.ResponseWriter, r *http.Request) {
	// Upgrade initial GET request to a WebSocket
	ws, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Fatal(err)
	}
	defer ws.Close()

	// Register the new client
	clientsMutex.Lock()
	clients[ws] = true
	clientsMutex.Unlock()

	for {
		var msg map[string]interface{}
		if err := ws.ReadJSON(&msg); err != nil {
			log.Printf("Error reading JSON: %v", err)
			break
		}

		log.Printf("Received message: %+v", msg)

		// Broadcast the message to all other clients
		broadcastMessage(ws, msg)
	}

	// Unregister the client
	clientsMutex.Lock()
	delete(clients, ws)
	clientsMutex.Unlock()
}

func broadcastMessage(sender *websocket.Conn, message map[string]interface{}) {
	clientsMutex.Lock()
	defer clientsMutex.Unlock()

	for client := range clients {
		if client != sender {
			err := client.WriteJSON(message)
			if err != nil {
				log.Printf("Error writing JSON: %v", err)
			}
		}
	}
}

func main() {
	http.HandleFunc("/ws", handleConnections)
	fmt.Println("Server is running on :8080")
	log.Fatal(http.ListenAndServe(":8080", nil))
}

// var upgrader = websocket.Upgrader{
// 	ReadBufferSize:  1024,
// 	WriteBufferSize: 1024,
// 	CheckOrigin: func(r *http.Request) bool {
// 		return true
// 	},
// }

// var participants = make(map[*websocket.Conn]bool)

// func handleConnections(w http.ResponseWriter, r *http.Request) {
// 	ws, err := upgrader.Upgrade(w, r, nil)
// 	if err != nil {
// 		log.Fatal(err)
// 	}
// 	defer ws.Close()

// 	// Allow only two participants
// 	if len(participants) == 2 {
// 		log.Println("Room is full. Rejecting connection.")
// 		return
// 	}

// 	participants[ws] = true
// 	log.Printf("Participant connected. Total participants: %d", len(participants))

// 	for {
// 		var msg map[string]interface{}
// 		if err := ws.ReadJSON(&msg); err != nil {
// 			log.Printf("Error reading JSON: %v", err)
// 			delete(participants, ws)
// 			break
// 		}

// 		log.Printf("Received message: %+v", msg)

// 		// Handle WebRTC signaling messages
// 		switch msg["type"] {
// 		case "offer":
// 			handleOffer(ws, msg)
// 		case "answer":
// 			handleAnswer(ws, msg)
// 		case "ice-candidate":
// 			handleICECandidate(ws, msg)
// 		}
// 	}
// }

// func handleOffer(sender *websocket.Conn, offer map[string]interface{}) {
// 	// Identify the other participant
// 	var receiver *websocket.Conn
// 	for participant := range participants {
// 		if participant != sender {
// 			receiver = participant
// 			break
// 		}
// 	}

// 	// Forward the offer to the other participant
// 	if receiver != nil {
// 		log.Printf("Forwarding offer from %v to %v", sender.RemoteAddr(), receiver.RemoteAddr())
// 		receiver.WriteJSON(offer)
// 	}
// }

// func handleAnswer(sender *websocket.Conn, answer map[string]interface{}) {
// 	// Identify the other participant
// 	var receiver *websocket.Conn
// 	for participant := range participants {
// 		if participant != sender {
// 			receiver = participant
// 			break
// 		}
// 	}

// 	// Forward the answer to the other participant
// 	if receiver != nil {
// 		log.Printf("Forwarding answer from %v to %v", sender.RemoteAddr(), receiver.RemoteAddr())
// 		receiver.WriteJSON(answer)
// 	}
// }

// func handleICECandidate(sender *websocket.Conn, candidate map[string]interface{}) {
// 	// Identify the other participant
// 	var receiver *websocket.Conn
// 	for participant := range participants {
// 		if participant != sender {
// 			receiver = participant
// 			break
// 		}
// 	}

// 	// Forward the ICE candidate to the other participant
// 	if receiver != nil {
// 		log.Printf("Forwarding ICE candidate from %v to %v", sender.RemoteAddr(), receiver.RemoteAddr())
// 		receiver.WriteJSON(candidate)
// 	}
// }

// func main() {
// 	http.HandleFunc("/ws", handleConnections)
// 	fmt.Println("Server is running on :8080")
// 	log.Fatal(http.ListenAndServe(":8080", nil))
// }
