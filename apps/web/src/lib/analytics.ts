import posthog from 'posthog-js'

// Initialize PostHog
if (import.meta.env.VITE_POSTHOG_KEY) {
  posthog.init(import.meta.env.VITE_POSTHOG_KEY, {
    api_host: import.meta.env.VITE_POSTHOG_HOST || 'https://app.posthog.com',
    loaded: () => {
      if (import.meta.env.MODE === 'development') {
        console.log('PostHog initialized')
      }
    },
  })
}

// Track key events
export const analytics = {
  // Auth events
  signup: () => posthog.capture('signup'),
  login: () => posthog.capture('login'),
  logout: () => posthog.capture('logout'),
  
  // Onboarding
  onboarding_started: () => posthog.capture('onboarding_started'),
  onboarding_completed: () => posthog.capture('onboarding_completed'),
  onboarding_step_completed: (step: number) => 
    posthog.capture('onboarding_step_completed', { step }),
  
  // Chore events
  chore_created: (choreId: string) => 
    posthog.capture('chore_created', { chore_id: choreId }),
  chore_claimed: (choreId: string) => 
    posthog.capture('chore_claimed', { chore_id: choreId }),
  chore_submitted: (choreId: string) => 
    posthog.capture('chore_submitted', { chore_id: choreId }),
  chore_approved: (choreId: string, points: number) => 
    posthog.capture('chore_approved', { chore_id: choreId, points }),
  
  // Kid events
  kid_added: (kidId: string) => 
    posthog.capture('kid_added', { kid_id: kidId }),
  
  // Goals
  goal_created: (goalId: string, targetAmount: number) => 
    posthog.capture('goal_created', { goal_id: goalId, target_amount: targetAmount }),
  goal_achieved: (goalId: string) => 
    posthog.capture('goal_achieved', { goal_id: goalId }),
  
  // Subscription
  subscription_started: (plan: string) => 
    posthog.capture('subscription_started', { plan }),
  subscription_cancelled: () => 
    posthog.capture('subscription_cancelled'),
  
  // Page views
  page_view: (page: string) => 
    posthog.capture('$pageview', { page }),
  
  // Identify user
  identify: (userId: string, traits?: Record<string, any>) => {
    posthog.identify(userId, traits)
  },
  
  // Reset on logout
  reset: () => posthog.reset(),
}

