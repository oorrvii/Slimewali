import type { ComponentType } from 'react'
import { RouterProvider, createBrowserRouter } from 'react-router-dom'
import { Layout } from '@/components/layout/Layout'
import { AuthProvider } from '@/features/auth/AuthProvider'
import { CartProvider } from '@/features/cart/CartProvider'
import { AccountLayout } from '@/features/account/AccountLayout'
import { RequireAdmin, RequireAuth } from '@/features/auth/guards'
import { HomePage } from '@/pages/HomePage'
import { ShopPage } from '@/pages/ShopPage'
import { CategoryPage } from '@/pages/CategoryPage'
import { ProductPage } from '@/pages/ProductPage'
import { InfoPage } from '@/pages/InfoPage'
import { ContactPage } from '@/pages/ContactPage'
import { SettingsProvider } from '@/features/settings/SettingsProvider'
import { NotFoundPage } from '@/pages/NotFoundPage'
import { ErrorPage } from '@/pages/ErrorPage'
import { SignInPage } from '@/pages/SignInPage'
import { CartPage } from '@/pages/CartPage'
import { CheckoutPage } from '@/pages/CheckoutPage'
import { AccountHomePage } from '@/pages/account/AccountHomePage'
import { AccountOrdersPage } from '@/pages/account/AccountOrdersPage'
import { AccountOrderDetailPage } from '@/pages/account/AccountOrderDetailPage'
import { OrderConfirmationPage } from '@/pages/OrderConfirmationPage'
import { AccountAddressesPage } from '@/pages/account/AccountAddressesPage'
import { AccountProfilePage } from '@/pages/account/AccountProfilePage'
import { AccountHelpPage } from '@/pages/account/AccountHelpPage'

const adminPage = (load: () => Promise<Record<string, unknown>>, name: string) => async () => {
  const module = await load()
  return { Component: module[name] as ComponentType }
}

const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    errorElement: <ErrorPage />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'shop', element: <ShopPage /> },
      { path: 'category/:slug', element: <CategoryPage /> },
      { path: 'product/:slug', element: <ProductPage /> },
      { path: 'cart', element: <CartPage /> },
      ...(import.meta.env.DEV ? [{ path: 'design-system', lazy: adminPage(() => import('@/pages/DesignSystemPage'), 'DesignSystemPage') }] : []),
      { path: 'sign-in', element: <SignInPage /> },
      {
        element: <RequireAuth />,
        children: [
          {
            element: <AccountLayout />,
            children: [
              { path: 'account', element: <AccountHomePage /> },
              { path: 'account/orders', element: <AccountOrdersPage /> },
              { path: 'account/orders/:id', element: <AccountOrderDetailPage /> },
              { path: 'account/addresses', element: <AccountAddressesPage /> },
              { path: 'account/profile', element: <AccountProfilePage /> },
              { path: 'account/help', element: <AccountHelpPage /> },
            ],
          },
          { path: 'checkout', element: <CheckoutPage /> },
          { path: 'order-confirmation/:id', element: <OrderConfirmationPage /> },
        ],
      },
      {
        element: <RequireAdmin />,
        children: [
          {
            lazy: adminPage(() => import('@/features/admin/AdminLayout'), 'AdminLayout'),
            children: [
              { path: 'admin', lazy: adminPage(() => import('@/pages/admin/AdminOverviewPage'), 'AdminOverviewPage') },
              { path: 'admin/orders', lazy: adminPage(() => import('@/pages/admin/AdminOrdersPage'), 'AdminOrdersPage') },
              { path: 'admin/orders/:id', lazy: adminPage(() => import('@/pages/admin/AdminOrderDetailPage'), 'AdminOrderDetailPage') },
              { path: 'admin/products', lazy: adminPage(() => import('@/pages/admin/AdminProductsPage'), 'AdminProductsPage') },
              { path: 'admin/products/new', lazy: adminPage(() => import('@/pages/admin/AdminProductEditPage'), 'AdminProductEditPage') },
              { path: 'admin/products/:id', lazy: adminPage(() => import('@/pages/admin/AdminProductEditPage'), 'AdminProductEditPage') },
              { path: 'admin/categories', lazy: adminPage(() => import('@/pages/admin/AdminCategoriesPage'), 'AdminCategoriesPage') },
              { path: 'admin/inventory', lazy: adminPage(() => import('@/pages/admin/AdminInventoryPage'), 'AdminInventoryPage') },
              { path: 'admin/settings', lazy: adminPage(() => import('@/pages/admin/AdminSettingsPage'), 'AdminSettingsPage') },
              { path: 'admin/pages', lazy: adminPage(() => import('@/pages/admin/AdminPagesPage'), 'AdminPagesPage') },
              { path: 'admin/pages/:id', lazy: adminPage(() => import('@/pages/admin/AdminPageEditPage'), 'AdminPageEditPage') },
              { path: 'admin/*', element: <NotFoundPage /> },
            ],
          },
        ],
      },
      { path: 'about', element: <InfoPage pageId="about" /> },
      { path: 'contact', element: <ContactPage /> },
      { path: 'faq', element: <InfoPage pageId="faq" /> },
      { path: 'shipping', element: <InfoPage pageId="shipping" /> },
      { path: 'returns', element: <InfoPage pageId="returns" /> },
      { path: 'privacy', element: <InfoPage pageId="privacy" /> },
      { path: 'terms', element: <InfoPage pageId="terms" /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])

export default function App() {
  return (
    <AuthProvider>
      <SettingsProvider>
        <CartProvider>
          <RouterProvider router={router} />
        </CartProvider>
      </SettingsProvider>
    </AuthProvider>
  )
}
