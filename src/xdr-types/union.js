import { resolveType } from './utils';
import * as dom from 'dts-dom';

function isValidIdentifier(str) {
  return /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(str);
}

/**
 * Checks if a literal node is present and of a valid type and returns the corresponding dts-dom type, otherwise returns the provided fallback type.
 * @param {*} literalNode - The AST node to check, expected to be a Literal node with a number or string value
 * @param {*} fallbackType - The dts-dom type to return if the literalNode is not a valid Literal with a number or string value
 * @returns {dts-dom.Type} The dts-dom type corresponding to the literal node or the fallback type if the node is not a valid literal
 */
function literalNodeToType(literalNode, fallbackType) {
  if (!literalNode || literalNode.type !== 'Literal') return fallbackType;
  if (typeof literalNode.value === 'number') {
    return dom.type.numberLiteral(literalNode.value);
  }
  if (typeof literalNode.value === 'string') {
    return dom.type.stringLiteral(literalNode.value);
  }
  return fallbackType;
}

function flattenTypes(typeList) {
  const out = [];
  typeList.forEach((t) => {
    if (!t) return;
    if (t.kind === 'union') {
      out.push(...flattenTypes(t.members));
    } else {
      out.push(t);
    }
  });
  return out;
}

function uniqTypes(typeList) {
  const seen = new Set();
  const out = [];
  flattenTypes(typeList).forEach((t) => {
    const key = JSON.stringify(t);
    if (seen.has(key)) return;
    seen.add(key);
    out.push(t);
  });
  return out;
}

export default function union(api, node, typeDefs) {
  const ns = typeDefs.ns;
  const [literal, objExp] = node.arguments;
  const name = literal.value;
  const union = dom.create.class(name);
  const buffer = dom.create.interface('Buffer');

  let switchOnType = dom.type.any;
  let switches;
  const arms = {};
  const valueTypes = [];

  objExp.properties.forEach((property) => {
    let xdrType;
    switch (property.key.name) {
      case 'switchOn': {
        xdrType = resolveType(api, property.value, typeDefs);
        union.members.unshift(dom.create.method('switch', [], xdrType));
        switchOnType = xdrType;
        break;
      }
      case 'arms': {
        property.value.properties.forEach((p) => {
          xdrType = resolveType(api, p.value, typeDefs);
          valueTypes.push(xdrType);
          union.members.push(
            dom.create.method(
              p.key.name,
              [
                dom.create.parameter(
                  'value',
                  xdrType,
                  dom.ParameterFlags.Optional
                )
              ],
              xdrType
            )
          );
          arms[p.key.name] = xdrType;
        });
        break;
      }
      case 'switches': {
        switches = property;
        break;
      }
      default:
        break;
    }
  });

  const isNumericSwitch = switchOnType === dom.type.number;
  const constructorOverloads = [];

  if (switches?.value?.elements) {
    switches.value.elements.forEach((entry) => {
      const switchLiteral = entry.elements[0];
      const armLiteralOrType = entry.elements[1];

      const hasNamedArm =
        armLiteralOrType &&
        armLiteralOrType.type === 'Literal' &&
        typeof armLiteralOrType.value === 'string' &&
        arms[armLiteralOrType.value];

      const armType = hasNamedArm ? arms[armLiteralOrType.value] : undefined;

      valueTypes.push(armType ?? dom.type.void);

      const switchValueType = literalNodeToType(switchLiteral, switchOnType);

      if (isNumericSwitch) {
        const params = [dom.create.parameter('switchValue', switchValueType)];
        if (armType) params.push(dom.create.parameter('value', armType));
        constructorOverloads.push(dom.create.constructor(params));
      }

      if (
        switchLiteral?.type === 'Literal' &&
        typeof switchLiteral.value === 'string' &&
        isValidIdentifier(switchLiteral.value)
      ) {
        const params = armType ? [dom.create.parameter('value', armType)] : [];
        union.members.push(
          dom.create.method(
            switchLiteral.value,
            params,
            union,
            dom.DeclarationFlags.Static
          )
        );
      }
    });
  }

  const finalValueTypes = uniqTypes(valueTypes);
  const valueType =
    finalValueTypes.length === 0
      ? dom.type.any
      : finalValueTypes.length === 1
        ? finalValueTypes[0]
        : dom.create.union(finalValueTypes);

  if (constructorOverloads.length > 0) {
    union.members.unshift(...constructorOverloads);
  }

  if (finalValueTypes.length > 0) {
    union.members.push(dom.create.method('value', [], valueType));
  }
  // IO methods
  union.members.push(
    dom.create.method(
      'toXDR',
      [
        dom.create.parameter(
          'format',
          dom.type.stringLiteral('raw'),
          dom.ParameterFlags.Optional
        )
      ],
      buffer
    )
  );
  union.members.push(
    dom.create.method(
      'toXDR',
      [
        dom.create.parameter(
          'format',
          dom.create.union([
            dom.type.stringLiteral('hex'),
            dom.type.stringLiteral('base64')
          ])
        )
      ],
      dom.type.string
    )
  );
  union.members.push(
    dom.create.method(
      'read',
      [dom.create.parameter('io', buffer)],
      union,
      dom.DeclarationFlags.Static
    )
  );
  union.members.push(
    dom.create.method(
      'write',
      [
        dom.create.parameter('value', union),
        dom.create.parameter('io', buffer)
      ],
      dom.type.void,
      dom.DeclarationFlags.Static
    )
  );
  union.members.push(
    dom.create.method(
      'isValid',
      [dom.create.parameter('value', union)],
      dom.type.boolean,
      dom.DeclarationFlags.Static
    )
  );
  union.members.push(
    dom.create.method(
      'toXDR',
      [dom.create.parameter('value', union)],
      buffer,
      dom.DeclarationFlags.Static
    )
  );
  union.members.push(
    dom.create.method(
      'fromXDR',
      [
        dom.create.parameter('input', buffer),
        dom.create.parameter(
          'format',
          dom.type.stringLiteral('raw'),
          dom.ParameterFlags.Optional
        )
      ],
      union,
      dom.DeclarationFlags.Static
    )
  );
  union.members.push(
    dom.create.method(
      'fromXDR',
      [
        dom.create.parameter('input', dom.type.string),
        dom.create.parameter(
          'format',
          dom.create.union([
            dom.type.stringLiteral('hex'),
            dom.type.stringLiteral('base64')
          ])
        )
      ],
      union,
      dom.DeclarationFlags.Static
    )
  );
  union.members.push(
    dom.create.method(
      'validateXDR',
      [
        dom.create.parameter('input', buffer),
        dom.create.parameter(
          'format',
          dom.type.stringLiteral('raw'),
          dom.ParameterFlags.Optional
        )
      ],
      dom.type.boolean,
      dom.DeclarationFlags.Static
    )
  );
  union.members.push(
    dom.create.method(
      'validateXDR',
      [
        dom.create.parameter('input', dom.type.string),
        dom.create.parameter(
          'format',
          dom.create.union([
            dom.type.stringLiteral('hex'),
            dom.type.stringLiteral('base64')
          ])
        )
      ],
      dom.type.boolean,
      dom.DeclarationFlags.Static
    )
  );

  ns.members.push(union);
}
