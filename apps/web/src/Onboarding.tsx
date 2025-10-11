import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Api } from './api';
import { toast } from 'sonner';
import { GlassPanel } from '@/components/Glass';
import { Check, ChevronRight } from 'lucide-react';

type OnboardingStep = {
  id: string;
  title: string;
  description: string;
  required: boolean;
  completed: boolean;
};

export default function Onboarding() {
  const navigate = useNavigate();
  const [me, setMe] = useState<any>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);

  // Step 1: Profile data
  const [phone, setPhone] = useState('');
  const [timezone, setTimezone] = useState('America/New_York');

  // Step 2: Kids data
  const [kids, setKids] = useState<Array<{ firstName: string; lastName: string; dob: string; pin: string; id?: string }>>([]);
  const [kidFirstName, setKidFirstName] = useState('');
  const [kidLastName, setKidLastName] = useState('');
  const [kidDob, setKidDob] = useState('');
  const [kidPin, setKidPin] = useState('');

  // Step 3: Rules data
  const [pointsPerCurrency, setPointsPerCurrency] = useState(100);
  const [currency, setCurrency] = useState('USD');
  const [weeklyAllowance, setWeeklyAllowance] = useState(0);
  const [requiredTaskPct, setRequiredTaskPct] = useState(20);

  // Step 4: Chores data
  const [templates, setTemplates] = useState<any[]>([]);
  const [selectedTemplates, setSelectedTemplates] = useState<Set<string>>(new Set());
  const [age, setAge] = useState(8);
  const [customChores, setCustomChores] = useState<Array<{ title: string; points: number; category: string }>>([]);
  const [customTitle, setCustomTitle] = useState('');
  const [customPoints, setCustomPoints] = useState(10);
  const [customCategory, setCustomCategory] = useState('home');

  const [steps, setSteps] = useState<OnboardingStep[]>([
    { id: 'welcome', title: 'Welcome', description: 'Get started with ChoreCoins', required: true, completed: false },
    { id: 'profile', title: 'Complete Profile', description: 'Add optional details', required: false, completed: false },
    { id: 'kids', title: 'Add Kids', description: 'Create profiles for your children', required: true, completed: false },
    { id: 'rules', title: 'Setup Rules', description: 'Configure points and currency', required: true, completed: false },
    { id: 'chores', title: 'Choose Chores', description: 'Pick starter chores', required: false, completed: false },
    { id: 'finish', title: 'All Set!', description: 'Review and finish', required: true, completed: false },
  ]);

  useEffect(() => {
    Api.me().then(data => {
      setMe(data);
      if (data?.user?.last_name) {
        setKidLastName(data.user.last_name);
      }
    });
  }, []);

  useEffect(() => {
    if (currentStep === 4) {
      Api.templates(age).then(j => setTemplates(j.templates || []));
    }
  }, [currentStep, age]);

  function markStepCompleted(stepId: string) {
    setSteps(prev => prev.map(s => s.id === stepId ? { ...s, completed: true } : s));
  }

  function canProceed(): boolean {
    const step = steps[currentStep];
    if (!step.required) return true;

    switch (step.id) {
      case 'welcome':
        return true;
      case 'profile':
        return true; // Optional
      case 'kids':
        return kids.length > 0;
      case 'rules':
        return pointsPerCurrency > 0;
      case 'chores':
        return true; // Optional
      case 'finish':
        return true;
      default:
        return false;
    }
  }

  async function handleNext() {
    const step = steps[currentStep];

    // Save current step data
    switch (step.id) {
      case 'welcome':
        markStepCompleted('welcome');
        break;

      case 'profile':
        // Could save profile data here if needed
        markStepCompleted('profile');
        break;

      case 'kids':
        if (kids.length === 0) {
          toast.error('Please add at least one kid to continue');
          return;
        }
        // Kids are already created, just mark complete
        markStepCompleted('kids');
        break;

      case 'rules':
        setLoading(true);
        try {
          const r = await Api.updateRules({
            points_per_currency: pointsPerCurrency,
            currency_code: currency,
            weekly_allowance_points: weeklyAllowance,
            required_task_min_pct: requiredTaskPct
          });
          if (r.ok) {
            markStepCompleted('rules');
            toast.success('Rules updated!');
          } else {
            toast.error(r.error || 'Failed to update rules');
            setLoading(false);
            return;
          }
        } catch (err) {
          toast.error('Network error');
          setLoading(false);
          return;
        }
        setLoading(false);
        break;

      case 'chores':
        // Create chores for each kid
        setLoading(true);
        try {
          for (const kid of kids) {
            if (!kid.id) continue;
            
            // Create from templates
            for (const templateId of selectedTemplates) {
              await Api.createChoreFromTemplate(kid.id, templateId);
            }
            
            // Create custom chores
            for (const chore of customChores) {
              await Api.createChore(kid.id, chore.title, chore.points, chore.category);
            }
          }
          markStepCompleted('chores');
          toast.success('Chores created!');
        } catch (err) {
          toast.error('Failed to create some chores');
        }
        setLoading(false);
        break;

      case 'finish':
        // Complete onboarding
        navigate('/balances');
        toast.success('🎉 Welcome to ChoreCoins!');
        return;
    }

    // Move to next step
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  }

  function handlePrevious() {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  }

  function handleSkip() {
    const step = steps[currentStep];
    if (step.required) {
      toast.error('This step is required');
      return;
    }
    markStepCompleted(step.id);
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  }

  async function addKid() {
    if (!kidFirstName || !kidLastName) {
      toast.error('First and last name are required');
      return;
    }

    setLoading(true);
    const displayName = `${kidFirstName} ${kidLastName}`;
    const r = await Api.createKid(displayName, kidDob || undefined, kidPin || undefined);
    setLoading(false);

    if (r.ok) {
      const newKid = { firstName: kidFirstName, lastName: kidLastName, dob: kidDob, pin: kidPin, id: r.kid_user_id };
      setKids([...kids, newKid]);
      toast.success(`✓ ${kidFirstName} ${kidLastName} added!`);
      // Reset form
      setKidFirstName('');
      setKidLastName(me?.user?.last_name || '');
      setKidDob('');
      setKidPin('');
    } else {
      toast.error(r.error || 'Failed to create kid');
    }
  }

  function removeKid(index: number) {
    setKids(kids.filter((_, i) => i !== index));
  }

  function toggleTemplate(id: string) {
    const next = new Set(selectedTemplates);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedTemplates(next);
  }

  function addCustomChore() {
    if (!customTitle) {
      toast.error('Chore title is required');
      return;
    }
    setCustomChores([...customChores, { title: customTitle, points: customPoints, category: customCategory }]);
    setCustomTitle('');
    setCustomPoints(10);
    toast.success('Custom chore added!');
  }

  function removeCustomChore(index: number) {
    setCustomChores(customChores.filter((_, i) => i !== index));
  }

  if (!me) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-zinc-400">Loading...</div>
      </div>
    );
  }

  const currentStepData = steps[currentStep];
  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Progress Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-white">Welcome to ChoreCoins!</h1>
              <p className="text-zinc-400 mt-1">Let's get your family set up in a few easy steps</p>
            </div>
            <div className="text-sm text-zinc-500">
              Step {currentStep + 1} of {steps.length}
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-2 bg-zinc-800/50 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Steps List */}
          <div className="mt-6 flex gap-2 flex-wrap">
            {steps.map((step, idx) => (
              <button
                key={step.id}
                onClick={() => setCurrentStep(idx)}
                disabled={idx > currentStep && !step.completed}
                className={`
                  px-4 py-2 rounded-lg text-sm transition-all
                  ${idx === currentStep ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : ''}
                  ${step.completed ? 'bg-zinc-700/50 text-zinc-300' : ''}
                  ${idx !== currentStep && !step.completed ? 'bg-zinc-800/30 text-zinc-500' : ''}
                  ${idx <= currentStep || step.completed ? 'cursor-pointer hover:scale-105' : 'cursor-not-allowed opacity-50'}
                `}
              >
                <div className="flex items-center gap-2">
                  {step.completed && <Check className="w-4 h-4" />}
                  <span>{step.title}</span>
                  {step.required && !step.completed && <span className="text-red-400">*</span>}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <GlassPanel>
          <div className="min-h-[400px]">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-white mb-2">{currentStepData.title}</h2>
              <p className="text-zinc-400">{currentStepData.description}</p>
            </div>

            {/* Step 0: Welcome */}
            {currentStepData.id === 'welcome' && (
              <div className="space-y-6">
                <div className="text-center py-8">
                  <div className="text-6xl mb-4">🎉</div>
                  <h3 className="text-xl font-semibold text-white mb-3">You're logged in as</h3>
                  <p className="text-emerald-400 text-lg font-medium">{me.user?.email}</p>
                  <p className="text-zinc-400 mt-4">
                    In the next few steps, we'll help you set up your family's chore system.
                  </p>
                </div>

                <div className="grid md:grid-cols-3 gap-4 mt-8">
                  <div className="card-glass p-4">
                    <div className="text-2xl mb-2">👨‍👩‍👧‍👦</div>
                    <h4 className="font-semibold text-white mb-1">Add Your Kids</h4>
                    <p className="text-sm text-zinc-400">Create profiles for each child</p>
                  </div>
                  <div className="card-glass p-4">
                    <div className="text-2xl mb-2">⚙️</div>
                    <h4 className="font-semibold text-white mb-1">Set Your Rules</h4>
                    <p className="text-sm text-zinc-400">Configure points and rewards</p>
                  </div>
                  <div className="card-glass p-4">
                    <div className="text-2xl mb-2">✅</div>
                    <h4 className="font-semibold text-white mb-1">Pick Chores</h4>
                    <p className="text-sm text-zinc-400">Choose from templates or create custom</p>
                  </div>
                </div>
              </div>
            )}

            {/* Step 1: Profile */}
            {currentStepData.id === 'profile' && (
              <div className="space-y-6">
                <p className="text-zinc-400">These details are optional but help us personalize your experience.</p>
                
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">Phone Number (optional)</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    className="w-full max-w-md bg-zinc-900/50 border border-zinc-700/50 rounded-lg px-4 py-2 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                    placeholder="+1 (555) 123-4567"
                  />
                  <p className="text-xs text-zinc-500 mt-1">For SMS reminders (coming soon)</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">Timezone</label>
                  <select
                    value={timezone}
                    onChange={e => setTimezone(e.target.value)}
                    className="w-full max-w-md bg-zinc-900/50 border border-zinc-700/50 rounded-lg px-4 py-2 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  >
                    <option value="America/New_York">Eastern Time (ET)</option>
                    <option value="America/Chicago">Central Time (CT)</option>
                    <option value="America/Denver">Mountain Time (MT)</option>
                    <option value="America/Los_Angeles">Pacific Time (PT)</option>
                    <option value="America/Anchorage">Alaska Time (AKT)</option>
                    <option value="Pacific/Honolulu">Hawaii Time (HT)</option>
                  </select>
                </div>
              </div>
            )}

            {/* Step 2: Kids */}
            {currentStepData.id === 'kids' && (
              <div className="space-y-6">
                <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-4">
                  <p className="text-emerald-300 text-sm">
                    ✓ Add at least one child to continue. You can always add more later.
                  </p>
                </div>

                {/* Added Kids */}
                {kids.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium text-zinc-300 mb-2">Your Kids ({kids.length})</h3>
                    {kids.map((kid, idx) => (
                      <div key={idx} className="card-glass p-4 flex items-center justify-between">
                        <div>
                          <div className="font-medium text-white">{kid.firstName} {kid.lastName}</div>
                          <div className="text-sm text-zinc-400">
                            {kid.dob && `Born: ${kid.dob}`} {kid.pin && `• PIN: ${kid.pin}`}
                          </div>
                        </div>
                        <button
                          onClick={() => removeKid(idx)}
                          className="text-red-400 hover:text-red-300 text-sm px-3 py-1 rounded hover:bg-red-500/10"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add Kid Form */}
                <div className="card-glass p-6 space-y-4">
                  <h3 className="font-semibold text-white">Add a Child</h3>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-zinc-300 mb-2">
                        First Name <span className="text-red-400">*</span>
                      </label>
                      <input
                        value={kidFirstName}
                        onChange={e => setKidFirstName(e.target.value)}
                        className="w-full bg-zinc-900/50 border border-zinc-700/50 rounded-lg px-4 py-2 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                        placeholder="Emma"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-zinc-300 mb-2">
                        Last Name <span className="text-red-400">*</span>
                      </label>
                      <input
                        value={kidLastName}
                        onChange={e => setKidLastName(e.target.value)}
                        className="w-full bg-zinc-900/50 border border-zinc-700/50 rounded-lg px-4 py-2 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                        placeholder="Smith"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">Birthdate (optional)</label>
                    <input
                      type="date"
                      value={kidDob}
                      onChange={e => setKidDob(e.target.value)}
                      className="w-full bg-zinc-900/50 border border-zinc-700/50 rounded-lg px-4 py-2 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">PIN (optional, 4-6 digits)</label>
                    <input
                      type="text"
                      maxLength={6}
                      value={kidPin}
                      onChange={e => setKidPin(e.target.value.replace(/\D/g, ''))}
                      className="w-full bg-zinc-900/50 border border-zinc-700/50 rounded-lg px-4 py-2 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                      placeholder="1234"
                    />
                    <p className="text-xs text-zinc-500 mt-1">If left blank, a random PIN will be generated</p>
                  </div>

                  <button
                    onClick={addKid}
                    disabled={loading}
                    className="btn-glass w-full"
                  >
                    {loading ? 'Adding...' : '+ Add Kid'}
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Rules */}
            {currentStepData.id === 'rules' && (
              <div className="space-y-6">
                <p className="text-zinc-400">Configure how points convert to real money and set up weekly allowances.</p>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="card-glass p-6 space-y-4">
                    <h3 className="font-semibold text-white mb-2">💰 Currency & Conversion</h3>
                    
                    <div>
                      <label className="block text-sm font-medium text-zinc-300 mb-2">Currency</label>
                      <select
                        value={currency}
                        onChange={e => setCurrency(e.target.value)}
                        className="w-full bg-zinc-900/50 border border-zinc-700/50 rounded-lg px-4 py-2 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                      >
                        <option value="USD">USD ($)</option>
                        <option value="EUR">EUR (€)</option>
                        <option value="GBP">GBP (£)</option>
                        <option value="CAD">CAD ($)</option>
                        <option value="AUD">AUD ($)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-zinc-300 mb-2">
                        Points per {currency === 'USD' ? 'Dollar' : 'Unit'}
                      </label>
                      <input
                        type="number"
                        value={pointsPerCurrency}
                        onChange={e => setPointsPerCurrency(parseInt(e.target.value) || 100)}
                        className="w-full bg-zinc-900/50 border border-zinc-700/50 rounded-lg px-4 py-2 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                      />
                      <p className="text-xs text-zinc-500 mt-1">
                        Example: {pointsPerCurrency} points = {currency === 'USD' ? '$1.00' : '1.00'}
                      </p>
                    </div>
                  </div>

                  <div className="card-glass p-6 space-y-4">
                    <h3 className="font-semibold text-white mb-2">📅 Weekly Settings</h3>
                    
                    <div>
                      <label className="block text-sm font-medium text-zinc-300 mb-2">Weekly Allowance (points)</label>
                      <input
                        type="number"
                        value={weeklyAllowance}
                        onChange={e => setWeeklyAllowance(parseInt(e.target.value) || 0)}
                        className="w-full bg-zinc-900/50 border border-zinc-700/50 rounded-lg px-4 py-2 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                      />
                      <p className="text-xs text-zinc-500 mt-1">
                        {weeklyAllowance > 0 ? `≈ ${(weeklyAllowance / pointsPerCurrency).toFixed(2)} ${currency}/week` : 'Set to 0 to disable'}
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-zinc-300 mb-2">
                        Required Tasks Minimum (%)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={requiredTaskPct}
                        onChange={e => setRequiredTaskPct(parseInt(e.target.value) || 20)}
                        className="w-full bg-zinc-900/50 border border-zinc-700/50 rounded-lg px-4 py-2 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                      />
                      <p className="text-xs text-zinc-500 mt-1">
                        Kids must complete at least {requiredTaskPct}% of required tasks to get allowance
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Chores */}
            {currentStepData.id === 'chores' && (
              <div className="space-y-6">
                <p className="text-zinc-400">Pick from age-appropriate chore templates or create your own custom chores.</p>

                {/* Age Filter */}
                <div className="flex items-center gap-4">
                  <label className="text-sm font-medium text-zinc-300">Filter by age:</label>
                  <input
                    type="range"
                    min="4"
                    max="17"
                    value={age}
                    onChange={e => setAge(parseInt(e.target.value))}
                    className="flex-1 max-w-xs"
                  />
                  <span className="text-white font-medium">{age} years</span>
                </div>

                {/* Template Selection */}
                <div className="card-glass p-6">
                  <h3 className="font-semibold text-white mb-4">📋 Chore Templates ({selectedTemplates.size} selected)</h3>
                  <div className="grid md:grid-cols-2 gap-3 max-h-96 overflow-y-auto pr-2">
                    {templates.map(t => (
                      <button
                        key={t.id}
                        onClick={() => toggleTemplate(t.id)}
                        className={`
                          text-left p-4 rounded-lg border transition-all
                          ${selectedTemplates.has(t.id) 
                            ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300' 
                            : 'bg-zinc-800/30 border-zinc-700/30 text-zinc-300 hover:border-zinc-600'
                          }
                        `}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="font-medium">{t.title}</div>
                            <div className="text-sm opacity-70 mt-1">{t.description}</div>
                            <div className="text-xs mt-2 opacity-60">
                              {t.category} • {t.default_points} pts • Ages {t.min_age}-{t.max_age}
                            </div>
                          </div>
                          {selectedTemplates.has(t.id) && <Check className="w-5 h-5 flex-shrink-0 ml-2" />}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom Chores */}
                <div className="card-glass p-6">
                  <h3 className="font-semibold text-white mb-4">✏️ Custom Chores ({customChores.length})</h3>
                  
                  {customChores.length > 0 && (
                    <div className="space-y-2 mb-4">
                      {customChores.map((chore, idx) => (
                        <div key={idx} className="flex items-center justify-between bg-zinc-800/30 rounded-lg p-3">
                          <div>
                            <span className="text-white font-medium">{chore.title}</span>
                            <span className="text-zinc-400 text-sm ml-2">• {chore.points} pts • {chore.category}</span>
                          </div>
                          <button
                            onClick={() => removeCustomChore(idx)}
                            className="text-red-400 hover:text-red-300 text-sm px-2 py-1 rounded hover:bg-red-500/10"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="grid md:grid-cols-3 gap-3">
                    <div className="md:col-span-1">
                      <label className="block text-sm font-medium text-zinc-300 mb-2">Title</label>
                      <input
                        value={customTitle}
                        onChange={e => setCustomTitle(e.target.value)}
                        className="w-full bg-zinc-900/50 border border-zinc-700/50 rounded-lg px-4 py-2 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                        placeholder="Water plants"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-zinc-300 mb-2">Points</label>
                      <input
                        type="number"
                        value={customPoints}
                        onChange={e => setCustomPoints(parseInt(e.target.value) || 10)}
                        className="w-full bg-zinc-900/50 border border-zinc-700/50 rounded-lg px-4 py-2 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-zinc-300 mb-2">Category</label>
                      <select
                        value={customCategory}
                        onChange={e => setCustomCategory(e.target.value)}
                        className="w-full bg-zinc-900/50 border border-zinc-700/50 rounded-lg px-4 py-2 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                      >
                        <option value="home">Home</option>
                        <option value="room">Room</option>
                        <option value="kitchen">Kitchen</option>
                        <option value="pets">Pets</option>
                        <option value="yard">Yard</option>
                        <option value="family">Family</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>
                  <button
                    onClick={addCustomChore}
                    className="btn-glass w-full mt-4"
                  >
                    + Add Custom Chore
                  </button>
                </div>
              </div>
            )}

            {/* Step 5: Finish */}
            {currentStepData.id === 'finish' && (
              <div className="space-y-6">
                <div className="text-center py-8">
                  <div className="text-6xl mb-4">✅</div>
                  <h3 className="text-2xl font-bold text-white mb-3">You're All Set!</h3>
                  <p className="text-zinc-400 max-w-lg mx-auto">
                    Your ChoreCoins account is ready. You can always modify settings, add more kids, or adjust rules later from your dashboard.
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="card-glass p-6">
                    <h4 className="font-semibold text-white mb-2">✓ Kids Added</h4>
                    <p className="text-zinc-400 text-sm">{kids.length} {kids.length === 1 ? 'child' : 'children'}</p>
                  </div>
                  <div className="card-glass p-6">
                    <h4 className="font-semibold text-white mb-2">✓ Rules Configured</h4>
                    <p className="text-zinc-400 text-sm">{pointsPerCurrency} pts = 1 {currency}</p>
                  </div>
                  <div className="card-glass p-6">
                    <h4 className="font-semibold text-white mb-2">✓ Chores Selected</h4>
                    <p className="text-zinc-400 text-sm">{selectedTemplates.size + customChores.length} total chores</p>
                  </div>
                  <div className="card-glass p-6">
                    <h4 className="font-semibold text-white mb-2">✓ Ready to Go!</h4>
                    <p className="text-zinc-400 text-sm">Start managing chores</p>
                  </div>
                </div>

                <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-6 text-center">
                  <p className="text-emerald-300">
                    Click "Finish" to go to your dashboard and start assigning chores!
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-zinc-700/30">
            <button
              onClick={handlePrevious}
              disabled={currentStep === 0}
              className="btn-glass-secondary disabled:opacity-30 disabled:cursor-not-allowed"
            >
              ← Previous
            </button>

            <div className="flex gap-3">
              {!currentStepData.required && currentStep > 0 && currentStep < steps.length - 1 && (
                <button
                  onClick={handleSkip}
                  className="text-zinc-400 hover:text-zinc-300 px-4 py-2"
                >
                  Skip this step
                </button>
              )}
              
              <button
                onClick={handleNext}
                disabled={!canProceed() || loading}
                className="btn-glass flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Loading...' : currentStep === steps.length - 1 ? 'Finish' : 'Next'}
                {!loading && <ChevronRight className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </GlassPanel>
      </div>
    </div>
  );
}
