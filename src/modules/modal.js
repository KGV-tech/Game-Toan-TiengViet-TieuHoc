// D3: accessible modal manager — focus trap, inert background, Escape and focus restore.
;(function (root) {
    if (!root.app) root.app = {};
    const app = root.app;
    const focusableSelector = [
        'a[href]',
        'area[href]',
        'button:not([disabled])',
        'input:not([disabled])',
        'select:not([disabled])',
        'textarea:not([disabled])',
        '[contenteditable="true"]',
        '[tabindex]:not([tabindex="-1"])'
    ].join(',');
    const stack = [];
    const inerted = new Map();

    function resolve(elementOrId) {
        if (!elementOrId) return null;
        if (typeof elementOrId === 'string') return document.getElementById(elementOrId);
        return elementOrId instanceof Element ? elementOrId : null;
    }

    function getDialog(modal) {
        return modal.matches('[role="dialog"]') ? modal : (modal.querySelector('[role="dialog"]') || modal);
    }

    function isVisible(element) {
        if (!element || !element.isConnected || element.hidden) return false;
        const style = window.getComputedStyle(element);
        return style.display !== 'none' && style.visibility !== 'hidden';
    }

    function isFocusable(element) {
        return isVisible(element) && !element.matches('[disabled], [aria-hidden="true"]') && !element.closest('[inert]');
    }

    function getFocusable(dialog) {
        return [...dialog.querySelectorAll(focusableSelector)].filter(isFocusable);
    }

    function rememberInert(element) {
        if (inerted.has(element)) return;
        inerted.set(element, {
            property: element.inert === true,
            attribute: element.hasAttribute('inert')
        });
    }

    function setInert(element, value) {
        rememberInert(element);
        element.inert = value;
        if (value) element.setAttribute('inert', '');
        else if (!inerted.get(element)?.attribute) element.removeAttribute('inert');
    }

    function clearBackgroundInert() {
        inerted.forEach((previous, element) => {
            element.inert = previous.property;
            if (previous.attribute) element.setAttribute('inert', '');
            else element.removeAttribute('inert');
        });
        inerted.clear();
    }

    function inertBackground(modal) {
        const rootElement = modal.closest('#app') || document.body;
        const path = [];
        let current = modal;
        while (current && current !== rootElement) {
            path.push(current);
            current = current.parentElement;
        }
        if (current !== rootElement) return;

        path.forEach(child => {
            [...child.parentElement.children].forEach(sibling => {
                if (sibling !== child) setInert(sibling, true);
            });
        });
    }

    function restoreFocus(element) {
        if (!element || !element.isConnected || element.disabled || !isVisible(element) || element.closest('[inert]')) return;
        element.focus({ preventScroll: true });
    }

    function resolveInitialFocus(item) {
        const target = typeof item.options.initialFocus === 'function'
            ? item.options.initialFocus(item.dialog, item.modal)
            : item.options.initialFocus;
        if (typeof target === 'string') return item.dialog.querySelector(target) || item.modal.querySelector(target);
        if (target instanceof Element) return target;
        return getFocusable(item.dialog)[0] || item.dialog;
    }

    function focusInitial(item) {
        if (stack[stack.length - 1] !== item) return;
        const target = resolveInitialFocus(item);
        if (target === item.dialog && !item.dialog.hasAttribute('tabindex')) item.dialog.setAttribute('tabindex', '-1');
        if (target && isVisible(target)) target.focus({ preventScroll: true });
    }

    function focusTop() {
        const item = stack[stack.length - 1];
        if (item) focusInitial(item);
    }

    function open(elementOrId, options = {}) {
        const modal = resolve(elementOrId);
        if (!modal) return null;
        const existing = stack.find(item => item.modal === modal);
        if (existing) {
            focusInitial(existing);
            return existing;
        }

        clearBackgroundInert();
        const dialog = getDialog(modal);
        const opener = options.returnFocus instanceof Element
            ? options.returnFocus
            : (document.activeElement instanceof Element ? document.activeElement : null);
        const item = { modal, dialog, opener, options };
        stack.push(item);
        modal.setAttribute('aria-hidden', 'false');
        inertBackground(modal);
        const frame = root.requestAnimationFrame || (callback => root.setTimeout(callback, 0));
        frame(() => focusInitial(item));
        return item;
    }

    function close(elementOrId, options = {}) {
        const modal = resolve(elementOrId);
        if (!modal) return false;
        const index = stack.findIndex(item => item.modal === modal);
        if (index < 0) {
            modal.setAttribute('aria-hidden', 'true');
            return false;
        }
        const [item] = stack.splice(index, 1);
        modal.setAttribute('aria-hidden', 'true');
        clearBackgroundInert();
        const top = stack[stack.length - 1];
        if (top) {
            inertBackground(top.modal);
            focusTop();
        } else if (options.restoreFocus !== false) {
            restoreFocus(options.returnFocus instanceof Element ? options.returnFocus : item.opener);
        }
        return true;
    }

    function closeTop(options = {}) {
        const item = stack[stack.length - 1];
        return item ? close(item.modal, options) : false;
    }

    function closeAll(options = {}) {
        while (stack.length) closeTop({ ...options, restoreFocus: false });
    }

    function onKeydown(event) {
        const item = stack[stack.length - 1];
        if (!item) return;

        if (event.key === 'Escape') {
            event.preventDefault();
            event.stopPropagation();
            if (typeof item.options.onEscape === 'function') item.options.onEscape(event);
            else close(item.modal);
            return;
        }
        if (event.key !== 'Tab') return;

        const focusables = getFocusable(item.dialog);
        if (!focusables.length) {
            event.preventDefault();
            item.dialog.focus({ preventScroll: true });
            return;
        }
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (!item.dialog.contains(document.activeElement)) {
            event.preventDefault();
            first.focus({ preventScroll: true });
        } else if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last.focus({ preventScroll: true });
        } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first.focus({ preventScroll: true });
        }
    }

    function onFocusin(event) {
        const item = stack[stack.length - 1];
        if (item && !item.dialog.contains(event.target)) focusInitial(item);
    }

    document.addEventListener('keydown', onKeydown, true);
    document.addEventListener('focusin', onFocusin, true);

    app.modal = { open, close, closeTop, closeAll, isOpen: modal => stack.some(item => item.modal === resolve(modal)) };
})(typeof globalThis !== 'undefined' ? globalThis : this);
