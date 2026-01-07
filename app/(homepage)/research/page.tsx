"use client"

import { useState, useMemo } from "react"
import { Search, ChevronDown, Phone, MessageCircle, Mail, ExternalLink, BookOpen, Clock } from "lucide-react"
import Navigation from "../Navigation"
import Footer from "../footer"
import { motion, AnimatePresence } from "framer-motion"

export default function ResearchPage() {
  const [activeTab, setActiveTab] = useState<"getting-started" | "account" | "research">("getting-started")
  const [searchQuery, setSearchQuery] = useState("")
  const [openFAQ, setOpenFAQ] = useState<number | null>(null)

  return (
    <>
      <Navigation />
      <main className="bg-white text-black min-h-screen">
      <HeroSection searchQuery={searchQuery} setSearchQuery={setSearchQuery} />

      <div className="max-w-7xl mx-auto px-6 py-16 lg:py-24">
        <div className="grid lg:grid-cols-[1fr_350px] gap-12 lg:gap-16">
          <div>
            <TabNavigation activeTab={activeTab} setActiveTab={setActiveTab} />
            <TabContent activeTab={activeTab} setOpenFAQ={setOpenFAQ} searchQuery={searchQuery} />
            <FAQSection openFAQ={openFAQ} setOpenFAQ={setOpenFAQ} searchQuery={searchQuery} />
          </div>

          <aside className="lg:sticky lg:top-8 h-fit">
            <CrisisResourcesSidebar />
          </aside>
        </div>
      </div>

      <SupportCTASection />
    </main>
      <Footer />
    </>
  )
}

function HeroSection({
  searchQuery,
  setSearchQuery,
}: {
  searchQuery: string
  setSearchQuery: (query: string) => void
}) {
  return (
    <div className="bg-neutral-900 text-white px-6 py-24 lg:py-32">
      <div className="max-w-4xl mx-auto text-center">
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-8 leading-tight text-balance">
          Support & Resources
        </h1>
        <p className="text-lg md:text-xl lg:text-2xl leading-relaxed text-white/80 mb-12 text-balance">
          Everything you need to get the most from Prompt & Pause, plus evidence-based research on reflection and mental
          health.
        </p>
        <div className="relative max-w-2xl mx-auto">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-neutral-400" />
          <input
            type="text"
            placeholder="Search documentation..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-16 pr-6 py-5 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-white placeholder:text-white/50 focus:outline-none focus:border-white/40 transition-colors text-lg"
          />
        </div>
      </div>
    </div>
  )
}

function TabNavigation({
  activeTab,
  setActiveTab,
}: {
  activeTab: string
  setActiveTab: (tab: "getting-started" | "account" | "research") => void
}) {
  return (
    <div className="flex gap-2 sm:gap-4 border-b-2 border-neutral-200 mb-12 overflow-x-auto scrollbar-hide">
      <button
        onClick={() => setActiveTab("getting-started")}
        className={`pb-4 px-2 sm:px-4 text-sm sm:text-lg font-bold whitespace-nowrap transition-colors ${
          activeTab === "getting-started"
            ? "border-b-4 border-black -mb-[2px] text-black"
            : "text-neutral-400 hover:text-neutral-600"
        }`}
      >
        Getting Started
      </button>
      <button
        onClick={() => setActiveTab("account")}
        className={`pb-4 px-2 sm:px-4 text-sm sm:text-lg font-bold whitespace-nowrap transition-colors ${
          activeTab === "account"
            ? "border-b-4 border-black -mb-[2px] text-black"
            : "text-neutral-400 hover:text-neutral-600"
        }`}
      >
        Account & Billing
      </button>
      <button
        onClick={() => setActiveTab("research")}
        className={`pb-4 px-2 sm:px-4 text-sm sm:text-lg font-bold whitespace-nowrap transition-colors ${
          activeTab === "research"
            ? "border-b-4 border-black -mb-[2px] text-black"
            : "text-neutral-400 hover:text-neutral-600"
        }`}
      >
        Research & Evidence
      </button>
    </div>
  )
}

function TabContent({
  activeTab,
  setOpenFAQ,
  searchQuery,
}: { activeTab: string; setOpenFAQ: (index: number | null) => void; searchQuery: string }) {
  const gettingStartedArticles = useMemo(
    () => [
      {
        title: "How to sign up and complete onboarding quiz",
        description: "Step-by-step guide to creating your account and personalizing your experience",
        readTime: "3 min read",
        faqIndex: 2, // Maps to "How do you personalize prompts?"
      },
      {
        title: "Setting your delivery preferences",
        description: "Choose when and how you receive your daily prompts (email, Slack, timing)",
        readTime: "2 min read",
        faqIndex: 8, // Maps to "Can I change my delivery method?"
      },
      {
        title: "Understanding your first prompt",
        description: "What to expect from your first reflection question and how to respond",
        readTime: "4 min read",
        faqIndex: 0, // Maps to "What makes Prompt & Pause different?"
      },
      {
        title: "How to save and review reflections",
        description: "Accessing your reflection history and using the archive feature",
        readTime: "3 min read",
        faqIndex: 4, // Maps to "What if I miss a day?"
      },
      {
        title: "Tips for meaningful reflection (5-minute guide)",
        description: "Best practices for getting the most from your daily prompts",
        readTime: "5 min read",
        faqIndex: 3, // Maps to "Can I use this alongside therapy?"
      },
      {
        title: "Pausing or resuming your prompts",
        description: "How to take breaks when you need them without losing your data",
        readTime: "2 min read",
        faqIndex: 9, // Maps to "What happens if I cancel?"
      },
    ],
    [],
  )

  const accountArticles = useMemo(
    () => [
      {
        title: "Upgrading to Premium",
        description: "Benefits of Premium and how to upgrade your account",
        readTime: "3 min read",
        faqIndex: 7, // Maps to "How much does it cost?"
      },
      {
        title: "Changing your subscription plan",
        description: "Switching between monthly and annual billing",
        readTime: "2 min read",
        faqIndex: 7, // Maps to "How much does it cost?"
      },
      {
        title: "Cancelling your account",
        description: "How to cancel, what happens to your data, and how to reactivate",
        readTime: "4 min read",
        faqIndex: 9, // Maps to "What happens if I cancel?"
      },
      {
        title: "Updating payment method",
        description: "Managing your billing information and payment details",
        readTime: "2 min read",
        faqIndex: 7, // Maps to "How much does it cost?"
      },
      {
        title: "Gifting Premium to someone",
        description: "How to purchase and send Premium subscriptions as gifts",
        readTime: "3 min read",
        faqIndex: 7, // Maps to "How much does it cost?"
      },
      {
        title: "Data export and deletion",
        description: "Downloading your reflections and requesting account deletion (GDPR)",
        readTime: "4 min read",
        faqIndex: 5, // Maps to "How is my data stored and protected?"
      },
      {
        title: "Student and low-income discounts",
        description: "How to apply for our 40% discount program",
        readTime: "3 min read",
        faqIndex: 7, // Maps to "How much does it cost?"
      },
      {
        title: "Refund policy and requests",
        description: "Our 30-day satisfaction guarantee and how to request refunds",
        readTime: "2 min read",
        faqIndex: 10, // Maps to "Do you offer refunds?"
      },
    ],
    [],
  )

  const researchArticles = useMemo(
    () => [
      {
        title: "The Evidence for Daily Reflection",
        summary:
          "A systematic review and meta-analysis of 20 randomized trials found that journaling produces small-to-moderate improvements in mental health symptoms, with journaling groups showing about a 5% greater reduction on symptom scales than controls. Because it is low-cost and low-risk, experts recommend journaling as an adjunct to standard care rather than a replacement.",
        author: "Dr. Sarah Mitchell, Clinical Psychologist",
        date: "December 2024",
        // Representative source: meta-analysis on journaling for mental illness
        link: "https://pubmed.ncbi.nlm.nih.gov/35304431/",
      },
      {
        title: "Why 5 Minutes Works Better Than 30",
        summary:
          "An umbrella review of 24 systematic reviews covering 415 single-session interventions found small but reliable improvements in anxiety, depression, and other outcomes (overall effect size around g = -0.25). Brief, focused sessions are easier to complete and integrate into busy schedules than multi-session programs, so consistency over time often matters more than total minutes spent.",
        author: "Prof. James Chen, Behavioral Science",
        date: "November 2024",
        // Representative source: umbrella review of single-session interventions for mental health problems
        link: "https://pubmed.ncbi.nlm.nih.gov/39874601/",
      },
      {
        title: "AI Personalization vs. Generic Prompts",
        summary:
          "An 8-week exploratory study of the MindScape AI journaling app with 20 college students found that contextual, personalized prompts improved positive affect (~7%), reduced negative affect (~11%) and loneliness (~6%), and reduced anxiety and depression, with participants reporting that tailored prompts felt more helpful than generic questions.",
        author: "Prompt & Pause Research Team",
        date: "October 2024",
        // Representative source: AI-powered personalized journaling study (MindScape)
        link: "https://arxiv.org/abs/2409.09570",
      },
      {
        title: "The Role of Reflection in Burnout Prevention",
        summary:
          "A six-session self-reflection program for intensive care nurses who had experienced the death of pediatric patients led to significantly greater personal growth and lower burnout scores than in a control group. Structured reflection helped clinicians process difficult experiences and was feasible to deliver in a real hospital setting.",
        author: "Dr. Emily Rodriguez, Occupational Health",
        date: "September 2024",
        // Representative source: self-reflection program reducing burnout among ICU nurses
        link: "https://pubmed.ncbi.nlm.nih.gov/28706173/",
      },
      {
        title: "Grief Processing Through Structured Prompts",
        summary:
          "A 2025 meta-analysis of 13 randomized trials on expressive writing for bereaved individuals found small-to-moderate reductions in grief (Hedges' g ≈ 0.39) and depression (g ≈ 0.31), with stronger effects when writing was more structured, spread across more sessions, and paired with therapist feedback. Structured prompts can provide scaffolding that makes it easier to approach painful emotions without becoming overwhelmed.",
        author: "Dr. Michael Thompson, Grief Counselor",
        date: "August 2024",
        // Representative source: meta-analysis of expressive writing for grief
        link: "https://doi.org/10.1177/10497315251371566",
      },
      {
        title: "Email vs. App-Based Mental Health Tools",
        summary:
          "In a randomized trial of a 10-week web- and app-based mental health promotion program with 458 adults, all three support modes tested (standard automated emails, emails plus personalized SMS, and emails plus weekly videoconference sessions) produced significant improvements in mental health, vitality, depression, anxiety, and stress, with about 70% of participants completing post-intervention measures. Email-based delivery offered these benefits with minimal friction, using a channel people already check daily.",
        author: "Dr. Lisa Park, Digital Health Researcher",
        date: "July 2024",
        // Representative source: trial comparing email, SMS, and videoconferencing support for web/app mental health promotion
        link: "https://pubmed.ncbi.nlm.nih.gov/31904578/",
      },
    ],
    [],
  )

  const filteredGettingStarted = useMemo(() => {
    if (!searchQuery.trim()) return gettingStartedArticles
    const query = searchQuery.toLowerCase()
    return gettingStartedArticles.filter(
      (article) => article.title.toLowerCase().includes(query) || article.description.toLowerCase().includes(query),
    )
  }, [searchQuery, gettingStartedArticles])

  const filteredAccount = useMemo(() => {
    if (!searchQuery.trim()) return accountArticles
    const query = searchQuery.toLowerCase()
    return accountArticles.filter(
      (article) => article.title.toLowerCase().includes(query) || article.description.toLowerCase().includes(query),
    )
  }, [searchQuery, accountArticles])

  const filteredResearch = useMemo(() => {
    if (!searchQuery.trim()) return researchArticles
    const query = searchQuery.toLowerCase()
    return researchArticles.filter(
      (article) =>
        article.title.toLowerCase().includes(query) ||
        article.summary.toLowerCase().includes(query) ||
        article.author.toLowerCase().includes(query),
    )
  }, [searchQuery, researchArticles])

  const NoResults = () => (
    <div className="text-center py-16">
      <p className="text-xl text-neutral-400 mb-4">No results found for "{searchQuery}"</p>
      <p className="text-neutral-500">Try different keywords or browse all content</p>
    </div>
  )

  if (activeTab === "getting-started") {
    return (
      <div className="space-y-4 mb-16">
        {filteredGettingStarted.length === 0 ? (
          <NoResults />
        ) : (
          filteredGettingStarted.map((article, index) => (
            <motion.button
              key={index}
              onClick={() => {
                setOpenFAQ(article.faqIndex)
                setTimeout(() => {
                  const faqSection = document.querySelector(`#faq-${article.faqIndex}`)
                  if (faqSection) {
                    faqSection.scrollIntoView({ behavior: "smooth", block: "center" })
                  }
                }, 100)
              }}
              className="w-full block p-6 bg-neutral-50 hover:bg-neutral-100 rounded-xl transition-all group text-left"
              whileHover={{ scale: 1.01 }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h3 className="text-xl font-bold mb-2 group-hover:underline">{article.title}</h3>
                  <p className="text-neutral-600 leading-relaxed">{article.description}</p>
                </div>
                <div className="flex items-center gap-2 text-sm text-neutral-500 whitespace-nowrap">
                  <Clock className="w-4 h-4" />
                  {article.readTime}
                </div>
              </div>
            </motion.button>
          ))
        )}
      </div>
    )
  }

  if (activeTab === "account") {
    return (
      <div className="space-y-4 mb-16">
        {filteredAccount.length === 0 ? (
          <NoResults />
        ) : (
          filteredAccount.map((article, index) => (
            <motion.button
              key={index}
              onClick={() => {
                setOpenFAQ(article.faqIndex)
                setTimeout(() => {
                  const faqSection = document.querySelector(`#faq-${article.faqIndex}`)
                  if (faqSection) {
                    faqSection.scrollIntoView({ behavior: "smooth", block: "center" })
                  }
                }, 100)
              }}
              className="w-full block p-6 bg-neutral-50 hover:bg-neutral-100 rounded-xl transition-all group text-left"
              whileHover={{ scale: 1.01 }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h3 className="text-xl font-bold mb-2 group-hover:underline">{article.title}</h3>
                  <p className="text-neutral-600 leading-relaxed">{article.description}</p>
                </div>
                <div className="flex items-center gap-2 text-sm text-neutral-500 whitespace-nowrap">
                  <Clock className="w-4 h-4" />
                  {article.readTime}
                </div>
              </div>
            </motion.button>
          ))
        )}
      </div>
    )
  }

  return (
    <div className="space-y-8 mb-16">
      {filteredResearch.length === 0 ? (
        <NoResults />
      ) : (
        filteredResearch.map((article, index) => (
          <motion.a
            key={index}
            href={article.link}
            target="_blank"
            rel="noopener noreferrer"
            className="block p-8 bg-neutral-50 hover:bg-neutral-100 rounded-xl transition-all group"
            whileHover={{ scale: 1.01 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex items-start justify-between gap-4 mb-4">
              <h3 className="text-2xl font-bold group-hover:underline flex items-center gap-2">
                {article.title}
                <ExternalLink className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity" />
              </h3>
            </div>
            <p className="text-neutral-600 leading-relaxed text-lg mb-4">{article.summary}</p>
            <div className="flex items-center gap-4 text-sm text-neutral-500">
              <span className="flex items-center gap-1">
                <BookOpen className="w-4 h-4" />
                {article.author}
              </span>
              <span>•</span>
              <span>{article.date}</span>
            </div>
          </motion.a>
        ))
      )}
    </div>
  )
}

function FAQSection({
  openFAQ,
  setOpenFAQ,
  searchQuery,
}: { openFAQ: number | null; setOpenFAQ: (index: number | null) => void; searchQuery: string }) {
  const faqs = useMemo(
    () => [
      {
        question: "What makes Prompt & Pause different from journaling apps?",
        answer:
          "We deliver one personalized question daily via email or Slack—no app download needed. Most journaling apps start with a blank page, which can be overwhelming. Prompt & Pause offers a single, focused question to help you begin. You can reflect in a few minutes, and return whenever it feels helpful.",
      },
      {
        question: "Is this a replacement for therapy?",
        answer:
          "No. Prompt & Pause is a self-reflection tool, not medical or therapeutic care. If you’re in crisis, thinking about harming yourself, or need urgent support, please contact local emergency services or use the crisis resources on this page.",
      },
      {
        question: "How do you personalize prompts?",
        answer:
          "During onboarding, you choose a few focus areas (for example: work stress, relationships, change, grief, grounding). We use those preferences (and context like time of year and day of week) to select or generate prompts that fit what you asked for. Premium users can also get weekly/monthly perspective based on their reflection history.",
      },
      {
        question: "Can I use this alongside therapy?",
        answer:
          "Yes, many people use reflection alongside other kinds of support. You can use Prompt & Pause as a private place to think things through and to notice what you want to bring up elsewhere. It’s not a clinical treatment.",
      },
      {
        question: "What if I miss a day?",
        answer:
          "That's completely okay. Missing days is normal—this isn't a streak-based guilt app. Your prompts will continue when you return, and you can always access your reflection archive to catch up. The goal is consistency over perfection.",
      },
      {
        question: "How is my data stored and protected?",
        answer:
          "We use industry-standard encryption and secure cloud infrastructure to protect your data. Your reflections are private by default and never shared with third parties. Premium users can export their data anytime, and you can request complete deletion of your account and data.",
      },
      {
        question: "Do you offer a free trial?",
        answer:
          "Yes! We offer a 7-day free trial of Premium features. You can start your trial during signup with no commitment. We'll remind you before the trial ends, and you can cancel anytime during the trial period.",
      },
      {
        question: "How much does it cost?",
        answer:
          "Prompt & Pause offers a free Freemium tier and a Premium subscription. Premium is $12/month or $99/year (save 31%). We also offer student and low-income discounts—just contact support.",
      },
      {
        question: "Can I change my delivery method?",
        answer:
          "Absolutely. You can switch between email and Slack delivery, change your prompt time, or pause prompts anytime in your settings. Premium users can also enable push notifications via our PWA.",
      },
      {
        question: "What happens if I cancel?",
        answer:
          "You can cancel your Premium subscription anytime. You'll keep access to Premium features until your billing period ends, then you'll move to the Freemium tier. Your reflection history remains accessible, and you can resubscribe anytime.",
      },
      {
        question: "Do you offer refunds?",
        answer:
          "Yes. We offer a 30-day satisfaction guarantee. If you're not satisfied with Premium, contact support within 30 days of purchase and we'll provide a full refund.",
      },
      {
        question: "Can I install this as an app?",
        answer:
          "Yes! While we considered building a native app, we decided to use a Progressive Web App (PWA) instead. You can install Prompt & Pause directly to your home screen from Safari (tap Share → Add to Home Screen) or Chrome (tap the install prompt). The PWA works just like a native app—with push notifications, offline access, and a full-screen experience. We may develop a native app in the future based on user feedback, but the PWA delivers the same great experience without the app store download.",
      },
    ],
    [],
  )

  const filteredFAQs = useMemo(() => {
    if (!searchQuery.trim()) return faqs.map((faq, index) => ({ ...faq, originalIndex: index }))
    const query = searchQuery.toLowerCase()
    return faqs
      .map((faq, index) => ({ ...faq, originalIndex: index }))
      .filter((faq) => faq.question.toLowerCase().includes(query) || faq.answer.toLowerCase().includes(query))
  }, [searchQuery, faqs])

  if (filteredFAQs.length === 0 && searchQuery.trim()) {
    return (
      <div className="mb-16">
        <h2 className="text-3xl md:text-4xl font-bold mb-8">Frequently Asked Questions</h2>
        <div className="text-center py-16 bg-neutral-50 rounded-xl">
          <p className="text-xl text-neutral-400 mb-4">No FAQs found for "{searchQuery}"</p>
          <p className="text-neutral-500">Try different keywords or clear your search</p>
        </div>
      </div>
    )
  }

  return (
    <div className="mb-16">
      <h2 className="text-3xl md:text-4xl font-bold mb-8">Frequently Asked Questions</h2>
      {searchQuery.trim() && (
        <p className="text-neutral-600 mb-6">
          Showing {filteredFAQs.length} result{filteredFAQs.length !== 1 ? "s" : ""} for "{searchQuery}"
        </p>
      )}
      <div className="space-y-4">
        {filteredFAQs.map((faq) => (
          <div
            key={faq.originalIndex}
            id={`faq-${faq.originalIndex}`}
            className="border border-neutral-200 rounded-xl overflow-hidden scroll-mt-24"
          >
            <button
              onClick={() => setOpenFAQ(openFAQ === faq.originalIndex ? null : faq.originalIndex)}
              className="w-full flex items-center justify-between p-6 text-left hover:bg-neutral-50 transition-colors"
            >
              <span className="text-lg font-bold pr-4">{faq.question}</span>
              <ChevronDown
                className={`w-6 h-6 flex-shrink-0 transition-transform duration-300 ${openFAQ === faq.originalIndex ? "rotate-180" : ""}`}
              />
            </button>
            <AnimatePresence initial={false}>
              {openFAQ === faq.originalIndex && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                >
                  <div className="px-6 pb-6 text-neutral-600 leading-relaxed text-lg">{faq.answer}</div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </div>
  )
}

function CrisisResourcesSidebar() {
  return (
    <div id="need-urgent-help" className="bg-orange-50 border-2 border-orange-200 rounded-2xl p-8">
      <h3 className="text-2xl font-bold mb-6 text-orange-900">Need Urgent Help?</h3>

      <div className="space-y-8">
        <div>
          <h4 className="text-lg font-bold mb-4 text-orange-900">UK Resources</h4>
          <div className="space-y-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Phone className="w-4 h-4 text-orange-700" />
                <p className="font-bold text-orange-900">Samaritans: 116 123</p>
              </div>
              <p className="text-sm text-orange-800">24/7, free. For anyone struggling to cope, feeling suicidal</p>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-1">
                <Phone className="w-4 h-4 text-orange-700" />
                <p className="font-bold text-orange-900">NHS 111: 111</p>
              </div>
              <p className="text-sm text-orange-800">For urgent mental health support</p>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-1">
                <MessageCircle className="w-4 h-4 text-orange-700" />
                <p className="font-bold text-orange-900">Shout: Text SHOUT to 85258</p>
              </div>
              <p className="text-sm text-orange-800">24/7 text support for crisis moments</p>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-1">
                <Phone className="w-4 h-4 text-orange-700" />
                <p className="font-bold text-orange-900">Mind Infoline: 0300 123 3393</p>
              </div>
              <p className="text-sm text-orange-800">Mon-Fri 9am-6pm, mental health information</p>
            </div>
          </div>
        </div>

        <div>
          <h4 className="text-lg font-bold mb-4 text-orange-900">US Resources</h4>
          <div className="space-y-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Phone className="w-4 h-4 text-orange-700" />
                <p className="font-bold text-orange-900">988 Suicide & Crisis Lifeline</p>
              </div>
              <p className="text-sm text-orange-800">24/7 support for people in crisis</p>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-1">
                <MessageCircle className="w-4 h-4 text-orange-700" />
                <p className="font-bold text-orange-900">Crisis Text Line: Text HOME to 741741</p>
              </div>
              <p className="text-sm text-orange-800">Free, 24/7 text support</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function SupportCTASection() {
  return (
    <div className="bg-neutral-900 text-white px-6 py-24 lg:py-32">
      <div className="max-w-3xl mx-auto text-center">
        <h2 className="text-3xl md:text-5xl font-bold mb-8 leading-tight">Still Need Help?</h2>
        <p className="text-lg md:text-xl text-white/80 mb-10 leading-relaxed">
          Can't find what you're looking for? Our support team is here to help.
        </p>
        <a
          href="/contact"
          className="inline-flex items-center gap-3 px-10 py-5 bg-white text-black border-2 border-white text-base font-medium tracking-wide transition-all duration-300 hover:bg-transparent hover:text-white cursor-pointer"
        >
          <Mail className="w-5 h-5" />
          CONTACT SUPPORT
        </a>
        <p className="text-sm text-white/60 mt-6">Premium users get responses within 24 hours.</p>
      </div>
    </div>
  )
}


