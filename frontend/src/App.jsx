import React, { useState } from 'react'
import Dashboard from './pages/Dashboard'
import Documents from './pages/Documents'
import DocChat from './pages/DocChat'
import QuizForge from './pages/QuizForge'
import GapSense from './pages/GapSense'
import LearnNext from './pages/LearnNext'

const NAV = [['dashboard', 'Dashboard', Dashboard], ['documents', 'Documents', Documents], ['docchat', 'DocChat', DocChat],
  ['quizforge', 'QuizForge', QuizForge], ['gapsense', 'GapSense', GapSense], ['learnnext', 'LearnNext', LearnNext]]

export default function App() {
  const [view, setView] = useState({ page: 'dashboard', params: null, n: 0 })
  const go = (page, params = null) => setView((v) => ({ page, params, n: v.n + 1 }))
  const Page = NAV.find((n) => n[0] === view.page)[2]
  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      <aside className="md:w-60 bg-white border-b md:border-r border-sky-100 p-4 md:min-h-screen">
        <div className="mb-4 md:mb-8"><div className="text-xl font-bold">Gap<span className="text-brand">Sense</span> AI</div>
          <div className="text-xs text-slate-500">Discover the gaps. Strengthen your knowledge.</div></div>
        <nav className="flex md:flex-col gap-1 overflow-x-auto">
          {NAV.map(([id, label]) => (
            <button key={id} onClick={() => go(id)} className={`text-left px-3 py-2 rounded-xl text-sm font-medium whitespace-nowrap ${view.page === id ? 'bg-brand text-white' : 'hover:bg-sky-100'}`}>{label}</button>))}
        </nav>
      </aside>
      <main className="flex-1 p-4 md:p-8 max-w-6xl"><Page key={view.n} go={go} params={view.params} /></main>
    </div>
  )
}
