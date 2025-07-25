package main

import (
	"log"
	"net/http"
)

func main() {
	// Serve files from the "static" directory
	fs := http.FileServer(http.Dir("./static"))
	http.Handle("/", fs)

	// Start the server
	log.Println("Server started at http://localhost:3000")
	err := http.ListenAndServe(":3000", nil)
	if err != nil {
		log.Fatal(err)
	}
}
