import React, { useState } from 'react';
import { 
  Sparkles, TrendingUp, Target, BookOpen, Award, 
  ChevronRight, Loader2, Brain, Lightbulb, Zap,
  CheckCircle, AlertCircle, Star, ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  analyzeProfile, 
  getSkillRecommendations, 
  generateCareerPath,
  ProfileAnalysis,
  SkillRecommendation,
  CareerPath
} from '../lib/ai-service';

interface AIProfileInsightsProps {
  employee: {
    firstName: string;
    lastName: string;
    designation: string;
    department: string;
    skills?: string[];
    certifications?: string[];
  };
}

export const AIProfileInsights: React.FC<AIProfileInsightsProps> = ({ employee }) => {
  const [activeTab, setActiveTab] = useState<'analysis' | 'skills' | 'career'>('analysis');
  const [isLoading, setIsLoading] = useState(false);
  const [profileAnalysis, setProfileAnalysis] = useState<ProfileAnalysis | null>(null);
  const [skillRecommendations, setSkillRecommendations] = useState<SkillRecommendation[] | null>(null);
  const [careerPath, setCareerPath] = useState<CareerPath | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyzeProfile = async () => {
    setIsLoading(true);
    setError(null);
    const { data, error } = await analyzeProfile({
      ...employee,
      skills: employee.skills || ['React', 'TypeScript', 'Node.js'],
      experience: 3
    });
    if (error) {
      setError(error);
    } else {
      setProfileAnalysis(data);
    }
    setIsLoading(false);
  };

  const handleGetSkillRecommendations = async () => {
    setIsLoading(true);
    setError(null);
    const { data, error } = await getSkillRecommendations(
      employee.skills || ['React', 'TypeScript'],
      employee.designation,
      employee.department
    );
    if (error) {
      setError(error);
    } else {
      setSkillRecommendations(data);
    }
    setIsLoading(false);
  };

  const handleGenerateCareerPath = async () => {
    setIsLoading(true);
    setError(null);
    const { data, error } = await generateCareerPath(
      employee.designation,
      'Engineering Manager',
      employee.skills || ['React', 'TypeScript', 'Node.js'],
      3
    );
    if (error) {
      setError(error);
    } else {
      setCareerPath(data);
    }
    setIsLoading(false);
  };

  const tabs = [
    { id: 'analysis', label: 'Profile Analysis', icon: Brain, action: handleAnalyzeProfile },
    { id: 'skills', label: 'Skill Suggestions', icon: Lightbulb, action: handleGetSkillRecommendations },
    { id: 'career', label: 'Career Path', icon: Target, action: handleGenerateCareerPath }
  ];

  return (
    <div className="bg-gradient-to-br from-[#1e1b27]/80 to-[#131118]/80 rounded-2xl border border-white/10 overflow-hidden">
      {/* Header */}
      <div className="p-5 border-b border-white/10 bg-gradient-to-r from-[#8055f6]/10 to-[#06b6d4]/10">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-br from-[#8055f6] to-[#06b6d4] rounded-xl">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-white flex items-center gap-2">
              AI-Powered Insights
              <span className="text-[10px] px-2 py-0.5 bg-[#8055f6]/20 text-[#8055f6] rounded-full font-medium">BETA</span>
            </h3>
            <p className="text-xs text-[#a49cba]">Get personalized career recommendations</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/10">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id as any);
              if (!isLoading) tab.action();
            }}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 text-sm font-medium transition-all ${
              activeTab === tab.id
                ? 'text-white bg-white/5 border-b-2 border-[#8055f6]'
                : 'text-[#a49cba] hover:text-white hover:bg-white/5'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="p-5 min-h-[300px]">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="relative">
              <div className="w-16 h-16 rounded-full border-4 border-[#8055f6]/20 border-t-[#8055f6] animate-spin"></div>
              <Sparkles className="absolute inset-0 m-auto w-6 h-6 text-[#8055f6]" />
            </div>
            <p className="mt-4 text-[#a49cba] text-sm">AI is analyzing your profile...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="w-12 h-12 text-red-400 mb-3" />
            <p className="text-white font-medium mb-1">Analysis Failed</p>
            <p className="text-sm text-[#a49cba] text-center max-w-xs">{error}</p>
            <button 
              onClick={tabs.find(t => t.id === activeTab)?.action}
              className="mt-4 px-4 py-2 bg-[#8055f6] text-white rounded-lg text-sm font-medium hover:bg-[#6d44d6] transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            {/* Profile Analysis Tab */}
            {activeTab === 'analysis' && profileAnalysis && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-5"
              >
                {/* Score Card */}
                <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-[#8055f6]/10 to-transparent rounded-xl border border-[#8055f6]/20">
                  <div className="relative">
                    <svg className="w-20 h-20 transform -rotate-90">
                      <circle cx="40" cy="40" r="36" stroke="#2c2839" strokeWidth="8" fill="none" />
                      <circle 
                        cx="40" cy="40" r="36" 
                        stroke="url(#scoreGradient)" 
                        strokeWidth="8" 
                        fill="none"
                        strokeDasharray={`${profileAnalysis.overallScore * 2.26} 226`}
                        strokeLinecap="round"
                      />
                      <defs>
                        <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#8055f6" />
                          <stop offset="100%" stopColor="#06b6d4" />
                        </linearGradient>
                      </defs>
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center text-2xl font-bold text-white">
                      {profileAnalysis.overallScore}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-[#a49cba]">Profile Score</p>
                    <p className="text-xl font-bold text-white">
                      {profileAnalysis.overallScore >= 80 ? 'Excellent' : 
                       profileAnalysis.overallScore >= 60 ? 'Good' : 'Needs Improvement'}
                    </p>
                  </div>
                </div>

                {/* Strengths */}
                <div>
                  <h4 className="text-sm font-semibold text-[#a49cba] mb-2 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-400" /> Strengths
                  </h4>
                  <div className="space-y-2">
                    {profileAnalysis.strengths.map((strength, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm text-white bg-emerald-500/10 px-3 py-2 rounded-lg border border-emerald-500/20">
                        <Star className="w-4 h-4 text-emerald-400" />
                        {strength}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Areas for Improvement */}
                <div>
                  <h4 className="text-sm font-semibold text-[#a49cba] mb-2 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-amber-400" /> Areas for Growth
                  </h4>
                  <div className="space-y-2">
                    {profileAnalysis.areasForImprovement.map((area, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm text-white bg-amber-500/10 px-3 py-2 rounded-lg border border-amber-500/20">
                        <Zap className="w-4 h-4 text-amber-400" />
                        {area}
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Skills Recommendations Tab */}
            {activeTab === 'skills' && skillRecommendations && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-4"
              >
                {skillRecommendations.map((skill, i) => (
                  <div 
                    key={i}
                    className="p-4 bg-white/5 rounded-xl border border-white/10 hover:border-[#8055f6]/30 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-semibold text-white flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-[#8055f6]" />
                        {skill.skill}
                      </h4>
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                        skill.relevance === 'high' 
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : skill.relevance === 'medium'
                          ? 'bg-amber-500/20 text-amber-400'
                          : 'bg-gray-500/20 text-gray-400'
                      }`}>
                        {skill.relevance.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-sm text-[#a49cba] mb-3">{skill.reason}</p>
                    {skill.learningResources && skill.learningResources.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {skill.learningResources.map((resource, j) => (
                          <span key={j} className="text-xs px-2 py-1 bg-[#8055f6]/10 text-[#8055f6] rounded-md">
                            {resource}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </motion.div>
            )}

            {/* Career Path Tab */}
            {activeTab === 'career' && careerPath && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-5"
              >
                {/* Path Overview */}
                <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-[#8055f6]/10 to-[#06b6d4]/10 rounded-xl">
                  <div className="text-center">
                    <p className="text-xs text-[#a49cba]">Current</p>
                    <p className="font-semibold text-white text-sm">{careerPath.currentRole}</p>
                  </div>
                  <div className="flex-1 flex items-center justify-center">
                    <ArrowRight className="w-6 h-6 text-[#8055f6]" />
                    <span className="text-xs text-[#a49cba] mx-2">{careerPath.timeframe}</span>
                    <ArrowRight className="w-6 h-6 text-[#06b6d4]" />
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-[#a49cba]">Target</p>
                    <p className="font-semibold text-white text-sm">{careerPath.targetRole}</p>
                  </div>
                </div>

                {/* Steps */}
                <div className="relative">
                  <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gradient-to-b from-[#8055f6] to-[#06b6d4]"></div>
                  <div className="space-y-4">
                    {careerPath.steps.map((step, i) => (
                      <div key={i} className="relative pl-10">
                        <div className="absolute left-2.5 w-3 h-3 rounded-full bg-gradient-to-r from-[#8055f6] to-[#06b6d4] border-2 border-[#131118]"></div>
                        <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-semibold text-white">{step.title}</h4>
                            <span className="text-xs text-[#a49cba]">{step.duration}</span>
                          </div>
                          <p className="text-sm text-[#a49cba] mb-3">{step.description}</p>
                          <div className="flex flex-wrap gap-2">
                            {step.skills.map((skill, j) => (
                              <span key={j} className="text-xs px-2 py-1 bg-[#8055f6]/10 text-[#8055f6] rounded-md">
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Initial State */}
            {!profileAnalysis && !skillRecommendations && !careerPath && !isLoading && (
              <div className="flex flex-col items-center justify-center py-12">
                <Sparkles className="w-12 h-12 text-[#8055f6] mb-4" />
                <p className="text-white font-medium mb-2">Get AI-Powered Insights</p>
                <p className="text-sm text-[#a49cba] text-center max-w-xs mb-4">
                  Click on any tab above to generate personalized recommendations for your career growth.
                </p>
                <button 
                  onClick={handleAnalyzeProfile}
                  className="px-6 py-2.5 bg-gradient-to-r from-[#8055f6] to-[#06b6d4] text-white rounded-xl font-medium hover:shadow-lg hover:shadow-[#8055f6]/30 transition-all flex items-center gap-2"
                >
                  <Brain className="w-4 h-4" />
                  Analyze My Profile
                </button>
              </div>
            )}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
};

export default AIProfileInsights;
