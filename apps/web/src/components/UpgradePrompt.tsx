import { Link } from 'react-router-dom'
import { Button } from './ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Sparkles } from 'lucide-react'

interface UpgradePromptProps {
  title?: string
  message?: string
  feature?: string
  className?: string
}

export default function UpgradePrompt({ 
  title = "Upgrade to Premium", 
  message = "This feature is available with Premium.",
  feature,
  className = ""
}: UpgradePromptProps) {
  return (
    <Card className={`border-emerald-500/50 bg-gradient-to-br from-emerald-950/50 to-zinc-900/50 ${className}`}>
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center">
          <Sparkles className="w-8 h-8 text-emerald-400" />
        </div>
        <CardTitle className="text-xl">{title}</CardTitle>
        <CardDescription className="mt-2">
          {message}
          {feature && (
            <span className="block mt-2 text-emerald-400 font-medium">
              {feature} is a Premium feature.
            </span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="text-center space-y-4">
        <div className="space-y-2">
          <p className="text-sm text-zinc-400">
            Premium includes:
          </p>
          <ul className="text-sm text-zinc-300 space-y-1">
            <li>✓ Unlimited kids & chores</li>
            <li>✓ Goals & achievements</li>
            <li>✓ Advanced features</li>
          </ul>
        </div>
        <Link to="/pricing">
          <Button className="w-full bg-emerald-500 hover:bg-emerald-600 text-white">
            Upgrade to Premium
          </Button>
        </Link>
        <p className="text-xs text-zinc-500">
          $9.99/month • 14-day free trial
        </p>
      </CardContent>
    </Card>
  )
}

