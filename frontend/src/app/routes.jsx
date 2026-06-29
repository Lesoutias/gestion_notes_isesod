import { createBrowserRouter, Navigate } from 'react-router-dom'
import PublicLayout from '../components/layout/PublicLayout'
import AdminLayout from '../components/admin/AdminLayout'
import { RequireAuth } from '../components/auth/RequireAuth'
import { ProtectedRoute } from '../components/auth/ProtectedRoute'
import HomePage from '../pages/HomePage'
import PresentationPage from '../pages/PresentationPage'
import FilieresPage from '../pages/FilieresPage'
import StatutJuridiquePage from '../pages/StatutJuridiquePage'
import OrganisationPage from '../pages/OrganisationPage'
import OrganisationDetailPage from '../pages/organisation/OrganisationDetailPage'
import EtudiantLoginPage from '../pages/auth/EtudiantLoginPage'
import EnseignantLoginPage from '../pages/auth/EnseignantLoginPage'
import AdminLoginPage from '../pages/auth/AdminLoginPage'
import AdminDashboard from '../pages/admin/AdminDashboard'
import EtudiantsPage from '../pages/admin/EtudiantsPage'
import EnseignantsPage from '../pages/admin/EnseignantsPage'
import EtudiantFormPage from '../pages/admin/EtudiantFormPage'
import EnseignantFormPage from '../pages/admin/EnseignantFormPage'
import AnneesAcademiquesPage from '../pages/admin/AnneesAcademiquesPage'
import CoursPage from '../pages/admin/CoursPage'
import CoursFormPage from '../pages/admin/CoursFormPage'
import AffectationsCoursPage from '../pages/admin/AffectationsCoursPage'
import AffecterCoursPromotionPage from '../pages/admin/AffecterCoursPromotionPage'
import AffecterEnseignantCoursPage from '../pages/admin/AffecterEnseignantCoursPage'
import EnseignantLayout from '../components/enseignant/EnseignantLayout'
import EnseignantDashboard from '../pages/enseignant/EnseignantDashboard'
import MesCoursPage from '../pages/enseignant/MesCoursPage'
import EvaluationsPage from '../pages/enseignant/EvaluationsPage'
import EvaluationFormPage from '../pages/enseignant/EvaluationFormPage'
import CotationEvaluationPage from '../pages/enseignant/CotationEvaluationPage'
import CahierNotesPage from '../pages/enseignant/CahierNotesPage'
import { EtudiantEspacePage } from '../pages/espace/EspacePages'
import NotFoundPage from '../pages/NotFoundPage'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <PublicLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'presentation', element: <PresentationPage /> },
      { path: 'filieres', element: <FilieresPage /> },
      { path: 'statut-juridique', element: <StatutJuridiquePage /> },
      { path: 'organisation', element: <OrganisationPage /> },
      { path: 'organisation/:slug', element: <OrganisationDetailPage /> },
      { path: 'connexion/etudiant', element: <EtudiantLoginPage /> },
      { path: 'connexion/enseignant', element: <EnseignantLoginPage /> },
      { path: 'connexion/admin', element: <AdminLoginPage /> },
      {
        path: 'espace/etudiant',
        element: (
          <RequireAuth role="etudiant">
            <EtudiantEspacePage />
          </RequireAuth>
        ),
      },
      { path: 'espace/enseignant', element: <Navigate to="/enseignant" replace /> },
      { path: 'espace/admin', element: <Navigate to="/admin/dashboard" replace /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
  {
    path: '/admin',
    element: (
      <ProtectedRoute role="admin">
        <AdminLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Navigate to="dashboard" replace /> },
      { path: 'dashboard', element: <AdminDashboard /> },
      { path: 'etudiants', element: <EtudiantsPage /> },
      { path: 'etudiants/nouveau', element: <EtudiantFormPage /> },
      { path: 'etudiants/:id/modifier', element: <EtudiantFormPage /> },
      { path: 'enseignants', element: <EnseignantsPage /> },
      { path: 'enseignants/nouveau', element: <EnseignantFormPage /> },
      { path: 'enseignants/:id/modifier', element: <EnseignantFormPage /> },
      { path: 'annees-academiques', element: <AnneesAcademiquesPage /> },
      { path: 'cours', element: <CoursPage /> },
      { path: 'cours/nouveau', element: <CoursFormPage /> },
      { path: 'cours/:id/modifier', element: <CoursFormPage /> },
      { path: 'affectations-cours', element: <AffectationsCoursPage /> },
      { path: 'affectations-cours/nouveau', element: <AffecterCoursPromotionPage /> },
      { path: 'affectations-cours/:id/modifier', element: <AffecterCoursPromotionPage /> },
      { path: 'affectations-cours/:id/enseignant', element: <AffecterEnseignantCoursPage /> },
    ],
  },
  {
    path: '/enseignant',
    element: (
      <ProtectedRoute role="enseignant">
        <EnseignantLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <EnseignantDashboard /> },
      { path: 'cours', element: <MesCoursPage /> },
      { path: 'evaluations', element: <EvaluationsPage /> },
      { path: 'evaluations/nouveau', element: <EvaluationFormPage /> },
      { path: 'evaluations/:id/modifier', element: <EvaluationFormPage /> },
      { path: 'evaluations/:id/cotation', element: <CotationEvaluationPage /> },
      { path: 'cahier-notes', element: <CahierNotesPage /> },
    ],
  },
])
