import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuthStore } from '../store/auth'
import ThemeToggle from '../components/ThemeToggle'

// Category data
const categories = [
  {
    id: 'getting-started',
    icon: 'rocket_launch',
    title: 'Getting Started',
    description: 'New here? Learn the basics and get up to speed quickly.',
    articles: 8,
    gradient: 'from-emerald-500 to-teal-600',
    bgGlow: 'bg-emerald-500/20',
  },
  {
    id: 'tickets',
    icon: 'confirmation_number',
    title: 'Tickets & Support',
    description: 'Create, track, and manage your support requests.',
    articles: 12,
    gradient: 'from-blue-500 to-indigo-600',
    bgGlow: 'bg-blue-500/20',
  },
  {
    id: 'account',
    icon: 'person',
    title: 'Account & Security',
    description: 'Manage your profile, password, and security settings.',
    articles: 6,
    gradient: 'from-violet-500 to-purple-600',
    bgGlow: 'bg-violet-500/20',
  },
  {
    id: 'integrations',
    icon: 'hub',
    title: 'Integrations',
    description: 'Connect with your favorite tools and services.',
    articles: 4,
    gradient: 'from-orange-500 to-red-600',
    bgGlow: 'bg-orange-500/20',
  },
  {
    id: 'billing',
    icon: 'payments',
    title: 'Billing & Plans',
    description: 'Understand your subscription and payment options.',
    articles: 5,
    gradient: 'from-pink-500 to-rose-600',
    bgGlow: 'bg-pink-500/20',
  },
  {
    id: 'troubleshooting',
    icon: 'build',
    title: 'Troubleshooting',
    description: 'Common issues and how to resolve them fast.',
    articles: 15,
    gradient: 'from-amber-500 to-orange-600',
    bgGlow: 'bg-amber-500/20',
  },
]

// Popular articles
const popularArticles = [
  {
    id: 1,
    title: 'How to Create Your First Support Ticket',
    category: 'Getting Started',
    readTime: '3 min read',
    views: 2847,
    featured: true,
  },
  {
    id: 2,
    title: 'Understanding Ticket Priority Levels',
    category: 'Tickets & Support',
    readTime: '4 min read',
    views: 1923,
  },
  {
    id: 3,
    title: 'Setting Up Two-Factor Authentication',
    category: 'Account & Security',
    readTime: '2 min read',
    views: 1654,
  },
  {
    id: 4,
    title: 'Tracking Your Ticket Status',
    category: 'Tickets & Support',
    readTime: '3 min read',
    views: 1432,
  },
  {
    id: 5,
    title: 'How to Upload Attachments',
    category: 'Getting Started',
    readTime: '2 min read',
    views: 1287,
  },
]

// FAQ data
const faqs = [
  {
    question: 'How quickly will I receive a response to my ticket?',
    answer: 'Our support team typically responds within 2-4 business hours for standard priority tickets. Critical issues are addressed within 1 hour. You\'ll receive email notifications for all updates.',
  },
  {
    question: 'Can I update a ticket after submitting it?',
    answer: 'Yes! You can add comments, upload additional attachments, and update the priority of your ticket at any time. Simply open the ticket from your dashboard and use the comment section.',
  },
  {
    question: 'How do I escalate an urgent issue?',
    answer: 'When creating a ticket, select "Critical" as the priority level. This ensures your issue is flagged for immediate attention. For existing tickets, you can update the priority from the ticket detail page.',
  },
  {
    question: 'What file types can I attach to tickets?',
    answer: 'We support most common file types including images (PNG, JPG, GIF), documents (PDF, DOC, DOCX), spreadsheets (XLS, XLSX), and text files. Maximum file size is 25MB per attachment.',
  },
  {
    question: 'How do I invite team members to my organization?',
    answer: 'If you\'re a Company Admin, navigate to User Management from your dashboard. Click "Add User" to invite new team members. They\'ll receive an email invitation to set up their account.',
  },
]

export default function KnowledgeBase() {
  const { user, logout } = useAuthStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [searchFocused, setSearchFocused] = useState(false)
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  const filteredCategories = categories.filter(
    (cat) =>
      cat.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cat.description.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-secondary)' }}>
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-white to-purple-50/30 dark:from-slate-800 dark:to-purple-900/30 border-b border-slate-200 dark:border-slate-700"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-purple-600 text-white shadow-lg">
                <span className="material-symbols-outlined text-xl">support_agent</span>
              </div>
              <div>
                <span className="font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                  Support Desk
                </span>
                <p className="text-xs text-slate-500 dark:text-slate-400">Knowledge Base</p>
              </div>
            </Link>

            <div className="flex items-center gap-4">
              <ThemeToggle />
              <div className="flex items-center gap-3">
                <div className="text-right hidden md:block">
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{user?.name}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 capitalize">{user?.role}</p>
                </div>
                <button
                  onClick={() => logout()}
                  className="text-slate-400 hover:text-primary transition-colors p-2 hover:bg-white dark:hover:bg-slate-700 rounded-lg"
                >
                  <span className="material-symbols-outlined">logout</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-40 dark:opacity-20">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, var(--border-primary) 1px, transparent 0)`,
            backgroundSize: '40px 40px',
          }} />
        </div>

        {/* Floating Gradient Orbs */}
        <motion.div
          animate={{
            x: [0, 30, 0],
            y: [0, -20, 0],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-20 left-1/4 w-72 h-72 bg-gradient-to-br from-primary/30 to-purple-500/30 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            x: [0, -20, 0],
            y: [0, 30, 0],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-40 right-1/4 w-96 h-96 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full blur-3xl"
        />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-3xl mx-auto"
          >
            {/* Eyebrow */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-primary/10 to-purple-500/10 border border-primary/20 mb-6"
            >
              <span className="material-symbols-outlined text-primary text-lg">auto_awesome</span>
              <span className="text-sm font-semibold text-primary">Help Center</span>
            </motion.div>

            {/* Main Title */}
            <h1 className="text-4xl md:text-6xl font-black mb-6 tracking-tight" style={{ color: 'var(--text-primary)' }}>
              How can we{' '}
              <span className="bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent">
                help you
              </span>
              ?
            </h1>

            {/* Subtitle */}
            <p className="text-lg md:text-xl mb-10" style={{ color: 'var(--text-secondary)' }}>
              Find answers, learn best practices, and get the most out of Support Desk.
            </p>

            {/* Search Bar */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className={`relative max-w-2xl mx-auto transition-all duration-300 ${
                searchFocused ? 'scale-105' : ''
              }`}
            >
              <div
                className={`absolute -inset-1 bg-gradient-to-r from-primary via-purple-500 to-pink-500 rounded-2xl blur transition-opacity duration-300 ${
                  searchFocused ? 'opacity-50' : 'opacity-0'
                }`}
              />
              <div
                className="relative flex items-center rounded-xl overflow-hidden shadow-2xl"
                style={{ backgroundColor: 'var(--bg-card)' }}
              >
                <span className="material-symbols-outlined text-2xl ml-5" style={{ color: 'var(--text-muted)' }}>
                  search
                </span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setSearchFocused(true)}
                  onBlur={() => setSearchFocused(false)}
                  placeholder="Search for articles, tutorials, guides..."
                  className="flex-1 px-4 py-5 text-lg bg-transparent outline-none"
                  style={{ color: 'var(--text-primary)' }}
                />
                <button className="m-2 px-6 py-3 bg-gradient-to-r from-primary to-purple-600 text-white font-semibold rounded-lg hover:opacity-90 transition-opacity">
                  Search
                </button>
              </div>

              {/* Search suggestions */}
              <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
                <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Popular:</span>
                {['create ticket', 'reset password', 'attachments'].map((term) => (
                  <button
                    key={term}
                    onClick={() => setSearchQuery(term)}
                    className="px-3 py-1 text-sm rounded-full border hover:border-primary hover:text-primary transition-colors"
                    style={{
                      color: 'var(--text-secondary)',
                      borderColor: 'var(--border-primary)',
                    }}
                  >
                    {term}
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Categories Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
            Browse by Category
          </h2>
          <p style={{ color: 'var(--text-secondary)' }}>
            Find what you need, organized by topic
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCategories.map((category, index) => (
            <motion.div
              key={category.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -8, scale: 1.02 }}
              className="group relative"
            >
              <div
                className="relative overflow-hidden rounded-2xl border p-6 h-full transition-all duration-300 hover:shadow-2xl"
                style={{
                  backgroundColor: 'var(--bg-card)',
                  borderColor: 'var(--border-primary)',
                }}
              >
                {/* Background glow */}
                <div className={`absolute -top-20 -right-20 w-40 h-40 ${category.bgGlow} rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

                {/* Icon */}
                <div className={`relative w-14 h-14 rounded-xl bg-gradient-to-br ${category.gradient} flex items-center justify-center mb-4 shadow-lg`}>
                  <span className="material-symbols-outlined text-white text-2xl">
                    {category.icon}
                  </span>
                </div>

                {/* Content */}
                <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors" style={{ color: 'var(--text-primary)' }}>
                  {category.title}
                </h3>
                <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
                  {category.description}
                </p>

                {/* Footer */}
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
                    {category.articles} articles
                  </span>
                  <span className="material-symbols-outlined text-slate-300 group-hover:text-primary group-hover:translate-x-2 transition-all">
                    arrow_forward
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Popular Articles */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex items-center justify-between mb-12"
        >
          <div>
            <h2 className="text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
              Popular Articles
            </h2>
            <p style={{ color: 'var(--text-secondary)' }}>
              Most viewed by our community
            </p>
          </div>
          <button className="hidden md:flex items-center gap-2 text-primary hover:text-purple-600 font-semibold group">
            View all articles
            <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">
              arrow_forward
            </span>
          </button>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Featured Article */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            whileHover={{ scale: 1.02 }}
            className="lg:row-span-2"
          >
            <div
              className="relative overflow-hidden rounded-2xl border h-full p-8 flex flex-col justify-end min-h-[400px] group cursor-pointer"
              style={{
                backgroundColor: 'var(--bg-card)',
                borderColor: 'var(--border-primary)',
              }}
            >
              {/* Background Pattern */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-purple-500/10" />
              <div className="absolute top-8 right-8 w-32 h-32 bg-gradient-to-br from-primary/20 to-purple-500/20 rounded-full blur-2xl" />

              {/* Large Icon */}
              <div className="absolute top-8 right-8">
                <span className="material-symbols-outlined text-8xl text-primary/10 group-hover:text-primary/20 transition-colors">
                  menu_book
                </span>
              </div>

              <div className="relative">
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary mb-4">
                  <span className="material-symbols-outlined text-sm">star</span>
                  Featured
                </span>
                <h3 className="text-2xl font-bold mb-3 group-hover:text-primary transition-colors" style={{ color: 'var(--text-primary)' }}>
                  {popularArticles[0].title}
                </h3>
                <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
                  Everything you need to know to get started with creating and managing support tickets effectively.
                </p>
                <div className="flex items-center gap-4 text-sm" style={{ color: 'var(--text-muted)' }}>
                  <span>{popularArticles[0].readTime}</span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">visibility</span>
                    {popularArticles[0].views.toLocaleString()} views
                  </span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Other Articles */}
          <div className="space-y-4">
            {popularArticles.slice(1).map((article, index) => (
              <motion.div
                key={article.id}
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ x: 8 }}
                className="group cursor-pointer"
              >
                <div
                  className="flex items-center gap-4 p-4 rounded-xl border hover:border-primary/50 transition-all"
                  style={{
                    backgroundColor: 'var(--bg-card)',
                    borderColor: 'var(--border-primary)',
                  }}
                >
                  {/* Number */}
                  <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-600 flex items-center justify-center font-bold text-slate-500 dark:text-slate-300">
                    {index + 2}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold mb-1 group-hover:text-primary transition-colors truncate" style={{ color: 'var(--text-primary)' }}>
                      {article.title}
                    </h4>
                    <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--text-muted)' }}>
                      <span className="px-2 py-0.5 rounded-full" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                        {article.category}
                      </span>
                      <span>{article.readTime}</span>
                    </div>
                  </div>

                  {/* Arrow */}
                  <span className="material-symbols-outlined text-slate-300 group-hover:text-primary transition-colors">
                    chevron_right
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-sm font-semibold mb-4">
            <span className="material-symbols-outlined text-lg">help</span>
            FAQ
          </span>
          <h2 className="text-3xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
            Frequently Asked Questions
          </h2>
          <p style={{ color: 'var(--text-secondary)' }}>
            Quick answers to common questions
          </p>
        </motion.div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              <div
                className="rounded-xl border overflow-hidden transition-all"
                style={{
                  backgroundColor: 'var(--bg-card)',
                  borderColor: openFaq === index ? 'var(--accent-primary)' : 'var(--border-primary)',
                }}
              >
                <button
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="w-full flex items-center justify-between p-5 text-left"
                >
                  <span className="font-semibold pr-4" style={{ color: 'var(--text-primary)' }}>
                    {faq.question}
                  </span>
                  <motion.span
                    animate={{ rotate: openFaq === index ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="material-symbols-outlined flex-shrink-0"
                    style={{ color: openFaq === index ? 'var(--accent-primary)' : 'var(--text-muted)' }}
                  >
                    expand_more
                  </motion.span>
                </button>

                <AnimatePresence>
                  {openFaq === index && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="px-5 pb-5 pt-0" style={{ color: 'var(--text-secondary)' }}>
                        <div className="pt-2 border-t" style={{ borderColor: 'var(--border-primary)' }}>
                          <p className="mt-3 leading-relaxed">{faq.answer}</p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Contact CTA */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="relative overflow-hidden rounded-3xl"
        >
          {/* Background */}
          <div className="absolute inset-0 bg-gradient-to-r from-primary via-purple-600 to-pink-600" />
          <div className="absolute inset-0 opacity-30" style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, rgba(255,255,255,0.3) 1px, transparent 0)`,
            backgroundSize: '32px 32px',
          }} />

          {/* Floating shapes */}
          <motion.div
            animate={{
              rotate: [0, 360],
              scale: [1, 1.1, 1],
            }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="absolute top-10 left-10 w-20 h-20 border-2 border-white/20 rounded-full"
          />
          <motion.div
            animate={{
              rotate: [360, 0],
            }}
            transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
            className="absolute bottom-10 right-20 w-32 h-32 border-2 border-white/10 rounded-xl"
          />

          <div className="relative px-8 py-16 md:py-20 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 text-white text-sm font-semibold mb-6 backdrop-blur-sm">
                <span className="material-symbols-outlined text-lg">support_agent</span>
                We're here to help
              </span>

              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Can't find what you're looking for?
              </h2>
              <p className="text-lg text-white/80 mb-8 max-w-2xl mx-auto">
                Our support team is just a message away. Create a ticket and we'll get back to you within hours.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  to="/"
                  className="inline-flex items-center gap-2 px-8 py-4 bg-white text-primary font-bold rounded-xl hover:bg-slate-100 transition-colors shadow-lg"
                >
                  <span className="material-symbols-outlined">add</span>
                  Create a Ticket
                </Link>
                <button className="inline-flex items-center gap-2 px-8 py-4 bg-white/10 text-white font-semibold rounded-xl hover:bg-white/20 transition-colors backdrop-blur-sm border border-white/20">
                  <span className="material-symbols-outlined">chat</span>
                  Live Chat
                </button>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8" style={{ borderColor: 'var(--border-primary)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center">
                <span className="material-symbols-outlined text-white text-sm">support_agent</span>
              </div>
              <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                Support Desk
              </span>
            </div>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              © 2025 Support Desk. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
