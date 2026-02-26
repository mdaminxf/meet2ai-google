import { motion } from 'motion/react';
import { ArrowRight, CheckCircle, Users, Zap, BookOpen, Globe, Shield, Star, Clock, Brain } from 'lucide-react';

interface LandingPageProps {
  onStart: () => void;
}

export default function LandingPage({ onStart }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-[#0f172a] text-white font-sans overflow-x-hidden">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0f172a]/80 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
                AI Classroom
              </span>
            </div>
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-8">
                <a href="#features" className="hover:text-blue-400 transition-colors px-3 py-2 rounded-md text-sm font-medium">Features</a>
                <a href="#about" className="hover:text-blue-400 transition-colors px-3 py-2 rounded-md text-sm font-medium">About</a>
                <a href="#team" className="hover:text-blue-400 transition-colors px-3 py-2 rounded-md text-sm font-medium">Team</a>
                <button 
                  onClick={onStart}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-full text-sm font-medium transition-all"
                >
                  Join Class
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-blue-600/20 rounded-full blur-[120px] -z-10"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8">
              <span className="block text-white">The Future of Learning</span>
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500">
                Is Here Today
              </span>
            </h1>
            <p className="mt-4 max-w-2xl mx-auto text-xl text-gray-400 mb-10">
              Experience an interactive AI-powered classroom where learning adapts to you. 
              Real-time whiteboard, code editor, and voice interaction.
            </p>
            
            <div className="flex justify-center gap-4">
              <button 
                onClick={onStart}
                className="group relative inline-flex items-center justify-center px-8 py-4 text-lg font-bold text-white transition-all duration-200 bg-blue-600 font-pj rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-600/30"
              >
                Start Learning Now
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <a 
                href="#features"
                className="inline-flex items-center justify-center px-8 py-4 text-lg font-bold text-white transition-all duration-200 bg-white/5 border border-white/10 rounded-full hover:bg-white/10 backdrop-blur-sm"
              >
                Learn More
              </a>
            </div>
          </motion.div>

          {/* Hero Image/Preview */}
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mt-20 relative rounded-2xl overflow-hidden border border-white/10 shadow-2xl shadow-blue-500/10"
          >
            <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a] via-transparent to-transparent z-10"></div>
            <img 
              src="https://images.unsplash.com/photo-1610484826967-09c5720778c7?q=80&w=2070&auto=format&fit=crop" 
              alt="AI Classroom Interface" 
              className="w-full h-auto object-cover opacity-80"
            />
          </motion.div>
        </div>
      </section>

      {/* Features Carousel */}
      <section id="features" className="py-24 bg-[#0f172a] relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Powerful Features</h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Everything you need for a seamless remote learning experience, powered by advanced AI.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: <Zap className="w-8 h-8 text-yellow-400" />,
                title: "Real-time AI Teacher",
                desc: "Interact naturally with voice commands. The AI explains concepts, writes on the board, and answers questions instantly."
              },
              {
                icon: <BookOpen className="w-8 h-8 text-blue-400" />,
                title: "Smart Whiteboard",
                desc: "Watch as the AI draws diagrams, writes equations, and highlights key points in real-time as it speaks."
              },
              {
                icon: <Globe className="w-8 h-8 text-green-400" />,
                title: "Live Code Editor",
                desc: "Switch to coding mode to learn programming languages. The AI writes, explains, and debugs code with you."
              }
            ].map((feature, i) => (
              <motion.div 
                key={i}
                whileHover={{ y: -10 }}
                className="p-8 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
              >
                <div className="mb-4 p-3 bg-white/5 rounded-xl inline-block">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-gray-400 leading-relaxed">
                  {feature.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-24 bg-[#1e293b] relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center gap-16">
            <div className="flex-1">
              <h2 className="text-3xl md:text-4xl font-bold mb-6">About The Project</h2>
              <p className="text-gray-300 text-lg leading-relaxed mb-6">
                AI Classroom is an experimental platform designed to bridge the gap between self-paced learning and personalized tutoring. 
                By leveraging the latest in Generative AI, we create a virtual teacher that can see, hear, and draw.
              </p>
              <p className="text-gray-300 text-lg leading-relaxed mb-8">
                Whether you're struggling with calculus, learning Python, or exploring history, our AI adapts to your pace and style.
              </p>
              
              <div className="grid grid-cols-2 gap-6">
                <div className="flex items-center gap-3">
                  <CheckCircle className="text-green-400 w-5 h-5" />
                  <span>24/7 Availability</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="text-green-400 w-5 h-5" />
                  <span>Personalized Pace</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="text-green-400 w-5 h-5" />
                  <span>Visual Learning</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="text-green-400 w-5 h-5" />
                  <span>Interactive Code</span>
                </div>
              </div>
            </div>
            <div className="flex-1 relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl blur-2xl opacity-20"></div>
              <img 
                src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=2071&auto=format&fit=crop" 
                alt="Team working" 
                className="relative rounded-2xl shadow-2xl border border-white/10"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section id="team" className="py-24 bg-[#0f172a]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Meet the Team</h2>
            <p className="text-gray-400">The minds behind the AI Classroom.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                name: "Alex Chen",
                role: "Lead Engineer",
                img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=1000&auto=format&fit=crop"
              },
              {
                name: "Sarah Johnson",
                role: "Product Designer",
                img: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=1000&auto=format&fit=crop"
              },
              {
                name: "Michael Ross",
                role: "AI Specialist",
                img: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=1000&auto=format&fit=crop"
              }
            ].map((member, i) => (
              <div key={i} className="text-center group">
                <div className="relative w-48 h-48 mx-auto mb-6 rounded-full overflow-hidden border-4 border-white/10 group-hover:border-blue-500 transition-colors">
                  <img src={member.img} alt={member.name} className="w-full h-full object-cover" />
                </div>
                <h3 className="text-xl font-bold">{member.name}</h3>
                <p className="text-blue-400">{member.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Upcoming Features */}
      <section className="py-24 bg-[#1e293b]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Coming Soon</h2>
            <p className="text-gray-400">We're constantly improving the platform.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: <Users />, title: "Multiplayer Mode", desc: "Learn with friends in shared classrooms." },
              { icon: <Shield />, title: "Certified Exams", desc: "Take AI-proctored exams and earn certificates." },
              { icon: <Star />, title: "Gamification", desc: "Earn XP and badges as you master new topics." },
              { icon: <Clock />, title: "Session Recording", desc: "Record and replay your classes anytime." }
            ].map((item, i) => (
              <div key={i} className="p-6 bg-white/5 rounded-xl border border-white/5 hover:border-white/20 transition-colors">
                <div className="mb-4 text-blue-400">{item.icon}</div>
                <h3 className="font-bold mb-2">{item.title}</h3>
                <p className="text-sm text-gray-400">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#0f172a] border-t border-white/10 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
              <Brain className="w-6 h-6 text-blue-500" />
              <span className="text-lg font-bold text-white">AI Classroom</span>
            </div>
            <div className="text-gray-400 text-sm">
              © 2024 AI Classroom. All rights reserved.
            </div>
            <div className="flex gap-6">
              <a href="#" className="text-gray-400 hover:text-white transition-colors">Privacy</a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">Terms</a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">Contact</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
