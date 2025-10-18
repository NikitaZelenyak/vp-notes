import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"

export default async function SetupPage() {
  const supabase = await createClient()

  // Check if user is authenticated
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="max-w-2xl w-full space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Database Setup Required</h1>
          <p className="text-muted-foreground">
            Your database needs to be initialized before you can start using the app.
          </p>
        </div>

        <div className="bg-card border rounded-lg p-6 space-y-4">
          <h2 className="text-xl font-semibold">Setup Instructions</h2>

          <div className="space-y-3 text-sm">
            <p className="text-muted-foreground">To initialize your database, you need to run the setup script:</p>

            <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
              <li>
                In the file explorer on the left, navigate to the{" "}
                <code className="bg-muted px-1 py-0.5 rounded">scripts</code> folder
              </li>
              <li>
                Click on <code className="bg-muted px-1 py-0.5 rounded">setup-database.js</code>
              </li>
              <li>Click the "Run" button to execute the script</li>
              <li>Wait for the script to complete (you'll see success messages in the console)</li>
              <li>Once complete, refresh this page or navigate to the home page</li>
            </ol>

            <div className="bg-muted p-3 rounded-md mt-4">
              <p className="font-mono text-xs">
                The script will create all necessary tables, enable Row Level Security, set up storage, and create
                database functions.
              </p>
            </div>
          </div>
        </div>

        <div className="text-center">
          <Button asChild variant="outline">
            <a href="/">Go to Home Page</a>
          </Button>
        </div>
      </div>
    </div>
  )
}
