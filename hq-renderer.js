/**
 * hq-renderer.js — AuDHD HQ Keyed List Renderer
 * Phase C2 — DOM Reconstruction
 *
 * Provides HQRenderer.list() for diff-patching keyed lists and
 * HQRenderer.fromTemplate() for cloning <template> elements.
 * Helper methods (setText, setAttr, setClass, emptyState) support
 * safe DOM writes without innerHTML for user data.
 *
 * Usage:
 *   HQRenderer.list(containerEl, items, {
 *     key:    item => item.id,
 *     build:  item => {
 *       const el = HQRenderer.fromTemplate('item-template');
 *       HQRenderer.setText(el, '.title', item.title);
 *       return el;
 *     },
 *     update: (el, item) => {
 *       HQRenderer.setText(el, '.title', item.title);
 *     },
 *     empty: '<div class="empty">Nothing here yet.</div>',
 *   });
 *
 * The `empty` option accepts a static HTML string (no user data),
 * a DOM Element, or omit it to leave the container unchanged when empty.
 */
(function () {
  'use strict';

  const HQRenderer = {

    /**
     * Diff-update a keyed list container.
     * Adds new items, updates existing ones in-place, removes stale ones.
     * Does not touch the DOM for items whose key exists and hasn't moved.
     *
     * @param {Element} container  — the list wrapper
     * @param {Array}   items      — current data array
     * @param {Object}  opts
     *   opts.key    {Function}         item → string key (must be unique)
     *   opts.build  {Function}         item → new Element (for new keys)
     *   opts.update {Function}         (el, item) → void (for existing keys)
     *   opts.empty  {string|Element}   shown when items is empty (optional)
     */
    list(container, items, opts) {
      if (!container) return;

      if (!items || !items.length) {
        if (opts.empty !== undefined) {
          this._setEmpty(container, opts.empty);
        }
        return;
      }

      // Remove empty-state placeholder if present
      const emptyEl = container.querySelector('[data-hq-empty]');
      if (emptyEl) emptyEl.remove();

      // Build a map of existing keyed children
      const existing = new Map();
      Array.from(container.children).forEach(el => {
        const k = el.dataset.hqKey;
        if (k !== undefined) existing.set(k, el);
      });

      // Diff pass: add new items, update and reorder existing ones
      items.forEach((item, idx) => {
        const key = String(opts.key(item));

        if (existing.has(key)) {
          const el = existing.get(key);
          opts.update(el, item);
          existing.delete(key); // mark as still alive

          // Reorder if the element is not already in the right position
          if (container.children[idx] !== el) {
            container.insertBefore(el, container.children[idx] || null);
          }
        } else {
          // New key — build and insert
          const el = opts.build(item);
          el.dataset.hqKey = key;
          container.insertBefore(el, container.children[idx] || null);
        }
      });

      // Remove elements whose keys are no longer in the list
      existing.forEach(el => el.remove());
    },

    /**
     * Clone a <template> element by id and return its first child element.
     * Throws clearly if the template is missing so errors surface immediately.
     *
     * @param  {string}  templateId  — the id attribute of the <template> tag
     * @returns {Element}
     */
    fromTemplate(templateId) {
      const tmpl = document.getElementById(templateId);
      if (!tmpl || tmpl.tagName !== 'TEMPLATE') {
        throw new Error('[HQRenderer] Template #' + templateId + ' not found');
      }
      return tmpl.content.cloneNode(true).firstElementChild;
    },

    /**
     * Replace container content with a standardised empty-state block.
     * Uses DOM methods — no user data passes through here.
     *
     * @param {Element}         container
     * @param {string|Element}  icon     — emoji or Element to use as icon
     * @param {string}          message  — plain text label
     */
    emptyState(container, icon, message) {
      if (!container) return;
      const wrapper = document.createElement('div');
      wrapper.className = 'empty';
      wrapper.setAttribute('data-hq-empty', '1');

      const ic = document.createElement('div');
      ic.className = 'empty-ic';
      if (typeof icon === 'string') {
        ic.textContent = icon;
      } else if (icon instanceof Element) {
        ic.appendChild(icon);
      }

      const msg = document.createElement('div');
      msg.textContent = message;

      wrapper.appendChild(ic);
      wrapper.appendChild(msg);
      container.replaceChildren(wrapper);
    },

    /**
     * Safely set textContent on a descendant matching selector.
     * No-op if the value hasn't changed (avoids unnecessary reflows).
     *
     * @param {Element} el
     * @param {string|null} selector  — CSS selector, or null/'' to target el itself
     * @param {*}      value          — coerced to string
     */
    setText(el, selector, value) {
      if (!el) return;
      const target = selector ? el.querySelector(selector) : el;
      if (!target) return;
      const str = String(value == null ? '' : value);
      if (target.textContent !== str) target.textContent = str;
    },

    /**
     * Set an attribute only if the value has changed.
     *
     * @param {Element} el
     * @param {string}  attr
     * @param {*}       value  — coerced to string
     */
    setAttr(el, attr, value) {
      if (!el) return;
      const str = String(value == null ? '' : value);
      if (el.getAttribute(attr) !== str) el.setAttribute(attr, str);
    },

    /**
     * Toggle a CSS class. Boolean coercion applied to condition.
     *
     * @param {Element} el
     * @param {string}  className
     * @param {*}       condition
     */
    setClass(el, className, condition) {
      if (!el) return;
      el.classList.toggle(className, Boolean(condition));
    },

    // ─── Internal helpers ─────────────────────────────────────────

    /**
     * Set or maintain a single empty-state node in a container.
     * Does not thrash the DOM if an empty node already exists.
     *
     * @param {Element}        container
     * @param {string|Element} empty  — static HTML string or Element
     */
    _setEmpty(container, empty) {
      let emptyEl = container.querySelector('[data-hq-empty]');
      if (emptyEl) return; // already showing an empty state — leave it

      // Remove all current children
      while (container.firstChild) container.removeChild(container.firstChild);

      if (typeof empty === 'string') {
        // empty HTML is authored by the developer, not user input — innerHTML is safe here
        const div = document.createElement('div');
        div.setAttribute('data-hq-empty', '1');
        div.innerHTML = empty;
        container.appendChild(div);
      } else if (empty instanceof Element) {
        empty.setAttribute('data-hq-empty', '1');
        container.appendChild(empty);
      }
    },
  };

  window.HQRenderer = HQRenderer;

})();
