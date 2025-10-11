import { Component, ReactNode } from 'react'
import { toast } from 'sonner'

export class ErrorBoundary extends Component<{children:ReactNode}, {hasError:boolean}> {
  constructor(p:any){ 
    super(p); 
    this.state={hasError:false}
  }
  
  static getDerivedStateFromError(){ 
    return {hasError:true} 
  }
  
  componentDidCatch(e:any){ 
    console.error(e); 
    toast.error('Something went wrong') 
  }
  
  render(){ 
    return this.state.hasError 
      ? <div className="p-6">Sorry, something went wrong.</div> 
      : this.props.children 
  }
}

