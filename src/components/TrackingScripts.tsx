/**
 * Scripts de rastreamento: Google Tag Manager e Facebook Pixel.
 * Só são injetados quando as variáveis de ambiente estão definidas.
 * Configure em .env.local:
 *   NEXT_PUBLIC_GTM_ID=GTM-XXXXXX
 *   NEXT_PUBLIC_FACEBOOK_PIXEL_ID=XXXXXXXXXXXXXXX
 */
import Script from "next/script";

const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID?.trim();
const FB_PIXEL_ID = process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID?.trim();

export function TrackingScripts() {
    return (
        <>
            {GTM_ID ? (
                <>
                    <Script
                        id="gtm"
                        strategy="afterInteractive"
                        dangerouslySetInnerHTML={{
                            __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${GTM_ID.replace(/'/g, "\\'")}');`,
                        }}
                    />
                    <noscript>
                        <iframe
                            src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
                            height="0"
                            width="0"
                            style={{ display: "none", visibility: "hidden" }}
                            title="Google Tag Manager"
                        />
                    </noscript>
                </>
            ) : null}
            {FB_PIXEL_ID ? (
                <Script
                    id="fb-pixel"
                    strategy="afterInteractive"
                    dangerouslySetInnerHTML={{
                        __html: `
!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
document,'script','https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '${FB_PIXEL_ID.replace(/'/g, "\\'")}');
fbq('track', 'PageView');
`,
                    }}
                />
            ) : null}
        </>
    );
}
