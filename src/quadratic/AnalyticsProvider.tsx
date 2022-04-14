import { useEffect } from 'react';

export const AnalyticsProvider = () => {
  useEffect(() => {
    // Only track analytics on hosted version
    if (process.env.REACT_APP_ANALYTICS !== 'true') return;

    // Only load analytics if it isn't already loaded
    //@ts-expect-error
    if (window.analytics) return;

    // set up segment analytics
    const script = document.createElement('script');
    script.innerText = `
    !function(){var analytics=window.analytics=window.analytics||[];if(!analytics.initialize)if(analytics.invoked)window.console&&console.error&&console.error("Segment snippet included twice.");else{analytics.invoked=!0;analytics.methods=["trackSubmit","trackClick","trackLink","trackForm","pageview","identify","reset","group","track","ready","alias","debug","page","once","off","on","addSourceMiddleware","addIntegrationMiddleware","setAnonymousId","addDestinationMiddleware"];analytics.factory=function(e){return function(){var t=Array.prototype.slice.call(arguments);t.unshift(e);analytics.push(t);return analytics}};for(var e=0;e<analytics.methods.length;e++){var key=analytics.methods[e];analytics[key]=analytics.factory(key)}analytics.load=function(key,e){var t=document.createElement("script");t.type="text/javascript";t.async=!0;t.src="https://cdn.segment.com/analytics.js/v1/" + key + "/analytics.min.js";var n=document.getElementsByTagName("script")[0];n.parentNode.insertBefore(t,n);analytics._loadOptions=e};analytics._writeKey="cWnyFiltxjWOGoVJ60SloGyNLRVbgV39";;analytics.SNIPPET_VERSION="4.15.3";
    analytics.load("cWnyFiltxjWOGoVJ60SloGyNLRVbgV39");
    analytics.page();
    }}();
    `;
    script.async = true;

    if (typeof window !== 'undefined') {
      document.body.appendChild(script);
    }
  });

  return null;
};
