(function() {
  function hideNextjsDevTools() {
    const devOverlayScript = document.querySelector('script[data-nextjs-dev-overlay="true"]');
    if (devOverlayScript) {
      devOverlayScript.remove();
    }
    
    const portal = document.querySelector('nextjs-portal');
    if (portal) {
      portal.remove();
    }
    
    const indicator = document.getElementById('devtools-indicator');
    if (indicator) {
      indicator.remove();
    }
    
    const portals = document.querySelectorAll('nextjs-portal');
    portals.forEach(portal => {
      const shadowRoot = portal.shadowRoot;
      if (shadowRoot) {
        const button = shadowRoot.querySelector('button[id="next-logo"], button[data-nextjs-dev-tools-button="true"]');
        if (button) {
          button.remove();
        }
        const indicator = shadowRoot.querySelector('#devtools-indicator');
        if (indicator) {
          indicator.remove();
        }
      }
    });
  }
  
  hideNextjsDevTools();
  
  const observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
      if (mutation.addedNodes.length) {
        hideNextjsDevTools();
      }
    });
  });
  
  if (document.body) {
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: false
    });
  }
  
  setInterval(hideNextjsDevTools, 100);
})();

