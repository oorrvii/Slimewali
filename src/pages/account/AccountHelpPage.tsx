import { LinkButton } from '@/components/ui/Button'
import { usePageTitle } from '@/hooks/usePageTitle'

export function AccountHelpPage() {
  usePageTitle('Help and contact')
  return (
    <div>
      <p className="eyebrow">Help</p>
      <h1 className="display-lg mt-2">Help and contact</h1>
      <p className="mt-4 max-w-xl text-char-soft">
        Questions about an order, shipping or your account? Our contact details and answers to common
        questions are on these pages.
      </p>
      <div className="mt-6 flex flex-wrap gap-3">
        <LinkButton to="/contact">Contact us</LinkButton>
        <LinkButton to="/faq" variant="outline">
          FAQ
        </LinkButton>
        <LinkButton to="/shipping" variant="outline">
          Shipping
        </LinkButton>
      </div>
      <p className="mt-8 max-w-xl text-sm text-char-soft">
        To delete your account and saved data, contact us using the details on the contact page.
      </p>
    </div>
  )
}
