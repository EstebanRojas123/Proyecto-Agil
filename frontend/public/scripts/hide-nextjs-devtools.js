(function() {
  function hideNextjsDevTools() {
    // Eliminar el script que crea el overlay de devtools
    const devOverlayScript = document.querySelector('script[data-nextjs-dev-overlay="true"]');
    if (devOverlayScript) {
      devOverlayScript.remove();
    }
    
    // Eliminar el portal de Next.js
    const portal = document.querySelector('nextjs-portal');
    if (portal) {
      portal.remove();
    }
    
    // Eliminar el indicador de devtools
    const indicator = document.getElementById('devtools-indicator');
    if (indicator) {
      indicator.remove();
    }
    
    // Buscar y eliminar el botón dentro del Shadow DOM
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
  
  // Ejecutar inmediatamente
  hideNextjsDevTools();
  
  // Usar MutationObserver para detectar cuando se agrega el portal
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
  
  // También ejecutar periódicamente
  setInterval(hideNextjsDevTools, 100);
})();

