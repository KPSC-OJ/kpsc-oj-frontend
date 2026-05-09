import { useEffect, useRef, useState, type ReactElement } from 'react'

type GoogleCredentialResponse = {
  credential?: string
  select_by?: string
}

type GoogleAccountsId = {
  cancel: () => void
  initialize: (configuration: {
    callback: (response: GoogleCredentialResponse) => void
    client_id: string
  }) => void
  renderButton: (
    parent: HTMLElement,
    options: {
      shape: 'rectangular'
      size: 'large'
      text: 'signin_with'
      theme: 'outline'
      width: number
    },
  ) => void
}

type GoogleIdentityWindow = Window &
  typeof globalThis & {
    google?: {
      accounts: {
        id: GoogleAccountsId
      }
    }
  }

type GoogleIdentityButtonProps = {
  onCredential: (idToken: string) => void
}

const googleIdentityScriptUrl = 'https://accounts.google.com/gsi/client'

let googleIdentityScriptPromise: Promise<void> | null = null

function loadGoogleIdentityScript(): Promise<void> {
  if ((window as GoogleIdentityWindow).google?.accounts.id) {
    return Promise.resolve()
  }

  if (googleIdentityScriptPromise) {
    return googleIdentityScriptPromise
  }

  googleIdentityScriptPromise = new Promise((resolve, reject) => {
    const existingScript = document.querySelector<HTMLScriptElement>(
      `script[src="${googleIdentityScriptUrl}"]`,
    )

    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(), { once: true })
      existingScript.addEventListener('error', () => reject(new Error('Google login load failed')), {
        once: true,
      })

      return
    }

    const script = document.createElement('script')
    script.async = true
    script.defer = true
    script.src = googleIdentityScriptUrl
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Google login load failed'))
    document.head.appendChild(script)
  })

  return googleIdentityScriptPromise
}

export function GoogleIdentityButton({ onCredential }: GoogleIdentityButtonProps): ReactElement {
  const buttonContainerRef = useRef<HTMLDivElement | null>(null)
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID
  const [status, setStatus] = useState<'idle' | 'missingClientId' | 'failed'>(() =>
    googleClientId ? 'idle' : 'missingClientId',
  )

  useEffect(() => {
    let isMounted = true
    const buttonContainer = buttonContainerRef.current

    if (!googleClientId) {
      return
    }

    loadGoogleIdentityScript()
      .then(() => {
        if (!isMounted || !buttonContainer) {
          return
        }

        const googleIdentity = (window as GoogleIdentityWindow).google?.accounts.id

        if (!googleIdentity) {
          setStatus('failed')

          return
        }

        buttonContainer.innerHTML = ''
        googleIdentity.initialize({
          callback: (response) => {
            if (response.credential) {
              onCredential(response.credential)
            }
          },
          client_id: googleClientId,
        })
        googleIdentity.renderButton(buttonContainer, {
          shape: 'rectangular',
          size: 'large',
          text: 'signin_with',
          theme: 'outline',
          width: 320,
        })
      })
      .catch(() => {
        if (isMounted) {
          setStatus('failed')
        }
      })

    return () => {
      isMounted = false

      if (buttonContainer) {
        buttonContainer.innerHTML = ''
      }

      ;(window as GoogleIdentityWindow).google?.accounts.id.cancel()
    }
  }, [googleClientId, onCredential])

  if (status === 'missingClientId') {
    return (
      <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
        학교 계정 로그인을 준비하고 있습니다. 잠시 후 다시 시도해주세요.
      </div>
    )
  }

  if (status === 'failed') {
    return (
      <div className="rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
        학교 계정 로그인 버튼을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.
      </div>
    )
  }

  return <div className="min-h-10" ref={buttonContainerRef} />
}
