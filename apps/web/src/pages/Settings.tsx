import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Rules from '../Rules'
import Reminders from '../Reminders'
import Requests from '../Requests'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default function Settings() {
  return (
    <div className="max-w-6xl mx-auto my-6 pb-20">
      <div className="relative mb-8">
        <h1 className="text-3xl font-bold text-white relative z-10">Settings</h1>
        <div className="absolute inset-x-0 -top-6 h-20 bg-[radial-gradient(40%_60%_at_10%_0%,rgba(16,185,129,0.15),transparent)]" />
      </div>

      <Tabs defaultValue="rules" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="rules">Rules</TabsTrigger>
          <TabsTrigger value="reminders">Reminders</TabsTrigger>
          <TabsTrigger value="requests">Requests</TabsTrigger>
        </TabsList>
        
        <TabsContent value="rules" className="mt-4">
          <Rules />
        </TabsContent>
        
        <TabsContent value="reminders" className="mt-4">
          <Reminders />
        </TabsContent>
        
        <TabsContent value="requests" className="mt-4">
          <Requests />
        </TabsContent>
      </Tabs>
    </div>
  )
}

