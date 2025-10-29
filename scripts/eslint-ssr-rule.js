/**
 * ESLint Rule: ssr/no-direct-browser-api
 *
 * Prevents direct access to browser APIs that break SSR.
 * Only allows browser API usage within safe contexts.
 */

module.exports = {
  meta: {
    type: "problem",
    docs: {
      description: "Disallow direct browser API access that breaks SSR",
      category: "Best Practices",
      recommended: true,
    },
    schema: [
      {
        type: "object",
        properties: {
          forbiddenGlobals: {
            type: "array",
            items: { type: "string" },
            default: [
              "window",
              "document",
              "navigator",
              "localStorage",
              "sessionStorage",
            ],
          },
          allowedContexts: {
            type: "array",
            items: { type: "string" },
            default: [
              "useEffect",
              "useLayoutEffect",
              "safeBrowserAPI",
              "isClient",
              "isServer",
            ],
          },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      forbiddenBrowserAPI:
        'Direct browser API access "{{api}}" is not allowed. Use safeBrowserAPI() or wrap in useEffect.',
      forbiddenInWrongContext:
        'Browser API "{{api}}" accessed outside safe context. Move to useEffect or use safeBrowserAPI().',
    },
  },

  create(context) {
    const options = context.options[0] || {};
    const forbiddenGlobals = options.forbiddenGlobals || [
      "window",
      "document",
      "navigator",
      "localStorage",
      "sessionStorage",
    ];
    const allowedContexts = options.allowedContexts || [
      "useEffect",
      "useLayoutEffect",
      "safeBrowserAPI",
      "isClient",
      "isServer",
    ];

    // Track current context
    let inSafeContext = false;
    let contextStack = [];

    return {
      // Track function calls that provide safe context
      CallExpression(node) {
        const calleeName = getCalleeName(node.callee);

        // Enter safe context
        if (allowedContexts.includes(calleeName)) {
          inSafeContext = true;
          contextStack.push(calleeName);
        }
      },

      "CallExpression:exit"(node) {
        const calleeName = getCalleeName(node.callee);

        // Exit safe context
        if (allowedContexts.includes(calleeName)) {
          contextStack.pop();
          inSafeContext = contextStack.length > 0;
        }
      },

      // Track identifier usage
      Identifier(node) {
        // Check if this is a forbidden global
        if (forbiddenGlobals.includes(node.name)) {
          // Allow if it's a parameter or variable declaration
          if (isInAllowedDeclaration(node)) {
            return;
          }

          // Allow in safe contexts
          if (inSafeContext) {
            return;
          }

          // Check if it's inside a safe wrapper
          if (isInSafeWrapper(node, context)) {
            return;
          }

          // Report the violation
          context.report({
            node,
            messageId: inSafeContext
              ? "forbiddenInWrongContext"
              : "forbiddenBrowserAPI",
            data: { api: node.name },
          });
        }
      },

      // Track member expressions (e.g., window.location, document.cookie)
      MemberExpression(node) {
        if (
          node.object.type === "Identifier" &&
          forbiddenGlobals.includes(node.object.name)
        ) {
          // Allow in safe contexts
          if (inSafeContext) {
            return;
          }

          // Check if it's inside a safe wrapper
          if (isInSafeWrapper(node, context)) {
            return;
          }

          context.report({
            node,
            messageId: "forbiddenBrowserAPI",
            data: { api: `${node.object.name}.${node.property.name}` },
          });
        }
      },
    };
  },
};

/**
 * Get the name of a function call
 */
function getCalleeName(callee) {
  if (callee.type === "Identifier") {
    return callee.name;
  }

  if (
    callee.type === "MemberExpression" &&
    callee.property.type === "Identifier"
  ) {
    return callee.property.name;
  }

  return null;
}

/**
 * Check if identifier is in an allowed declaration context
 */
function isInAllowedDeclaration(node) {
  let parent = node.parent;

  // Check up the AST for allowed contexts
  while (parent) {
    switch (parent.type) {
      case "VariableDeclarator":
        // Allow: const window = ...
        return true;

      case "FunctionDeclaration":
      case "FunctionExpression":
      case "ArrowFunctionExpression":
        // Allow parameters: function(window) { ... }
        if (
          parent.params.some(
            (param) => param.type === "Identifier" && param.name === node.name,
          )
        ) {
          return true;
        }
        break;

      case "Property":
        // Allow object properties: { window: ... }
        if (parent.key.name === node.name) {
          return true;
        }
        break;
    }

    parent = parent.parent;
  }

  return false;
}

/**
 * Check if node is inside a safe wrapper function
 */
function isInSafeWrapper(node, context) {
  let parent = node.parent;

  // Walk up the AST to find safe wrappers
  while (parent) {
    if (parent.type === "CallExpression") {
      const calleeName = getCalleeName(parent.callee);

      // Check if called with safe wrapper functions
      if (["safeBrowserAPI", "isClient", "isServer"].includes(calleeName)) {
        return true;
      }
    }

    // Stop at function boundaries
    if (
      [
        "FunctionDeclaration",
        "FunctionExpression",
        "ArrowFunctionExpression",
      ].includes(parent.type)
    ) {
      break;
    }

    parent = parent.parent;
  }

  return false;
}
