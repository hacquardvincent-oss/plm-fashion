import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import AppLayout from '../components/layout/AppLayout'
import LoginPage from '../pages/LoginPage'
import DashboardPage from '../pages/DashboardPage'
import CollectionsPage from '../pages/CollectionsPage'
import CollectionDetailPage from '../pages/CollectionDetailPage'
import ProductDetailPage from '../pages/ProductDetailPage'
import WorkflowsPage from '../pages/WorkflowsPage'
import FichesPage from '../pages/FichesPage'
import FicheDetailPage from '../pages/FicheDetailPage'
import PlaceholderPage from '../pages/PlaceholderPage'
import SpecSheetPage from '../pages/SpecSheetPage'
import SpecSheetsListPage from '../pages/SpecSheetsListPage'
import PurchasesPage from '../pages/PurchasesPage'
import PurchaseDetailPage from '../pages/PurchaseDetailPage'

function FullPageSpinner() {
  return (
    <div className="min-h-screen bg-cream flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
        <span className="text-dark/40 text-sm">Chargement…</span>
      </div>
    </div>
  )
}

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <FullPageSpinner />
  return user ? children : <Navigate to="/login" replace />
}

export default function AppRouter() {
  const { user, loading } = useAuth()
  if (loading) return <FullPageSpinner />

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <LoginPage />} />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/collections" element={<CollectionsPage />} />
        <Route path="/collections/:id" element={<CollectionDetailPage />} />
        <Route path="/products/:id" element={<ProductDetailPage />} />
        <Route path="/products/:id/spec-sheet" element={<SpecSheetPage />} />
        <Route path="/spec-sheets" element={<SpecSheetsListPage />} />
        <Route path="/workflows" element={<WorkflowsPage />} />
        <Route path="/purchases" element={<PurchasesPage />} />
        <Route path="/purchases/:id" element={<PurchaseDetailPage />} />
        <Route path="/fiches" element={<FichesPage />} />
        <Route path="/fiches/:id" element={<FicheDetailPage />} />
        <Route path="/materials" element={
          <PlaceholderPage title="Matières" description="Gestion du catalogue matières et fournitures — disponible prochainement." />
        } />
        <Route path="/suppliers" element={
          <PlaceholderPage title="Fournisseurs" description="Annuaire fournisseurs, évaluations et portail d'accès — disponible prochainement." />
        } />
        <Route path="/costing" element={
          <PlaceholderPage title="Costing global" description="Vue consolidée des coûts par collection — disponible prochainement." />
        } />
        <Route path="/documents" element={
          <PlaceholderPage title="Documents" description="Gestion documentaire centralisée — disponible prochainement." />
        } />
        <Route path="/users" element={
          <PlaceholderPage title="Utilisateurs" description="Gestion des comptes et des rôles — disponible prochainement." />
        } />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}
