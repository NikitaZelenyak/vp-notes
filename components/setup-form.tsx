"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, CheckCircle2, XCircle } from "lucide-react"
import { initializeDatabase } from "@/app/setup/actions"

export function SetupForm() {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [message, setMessage] = useState("")

  const handleSetup = async () => {
    setStatus("loading")
    setMessage("")

    const result = await initializeDatabase()

    if (result.success) {
      setStatus("success")
      setMessage("Database initialized successfully! Redirecting...")
      setTimeout(() => {
        window.location.href = "/"
      }, 2000)
    } else {
      setStatus("error")
      setMessage(result.error || "Failed to initialize database")
    }
  }

  return (
    <div className="space-y-4">
      <Button
        onClick={handleSetup}
        disabled={status === "loading" || status === "success"}
        className="w-full"
        size="lg"
      >
        {status === "loading" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {status === "success" && <CheckCircle2 className="mr-2 h-4 w-4" />}
        {status === "idle" && "Initialize Database"}
        {status === "loading" && "Initializing..."}
        {status === "success" && "Setup Complete!"}
        {status === "error" && "Try Again"}
      </Button>

      {message && (
        <Alert variant={status === "error" ? "destructive" : "default"}>
          {status === "error" && <XCircle className="h-4 w-4" />}
          {status === "success" && <CheckCircle2 className="h-4 w-4" />}
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      )}
    </div>
  )
}
