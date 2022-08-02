import * as dom from 'dts-dom';

/**
 * Builds a valid dts-dom node representing a XDR Bool.
 *
 */
export default function xdrBool(ns) {
  const buffer = dom.create.interface('Buffer');
  const boolInterface = dom.create.interface('Bool');

  boolInterface.members.push(
    dom.create.method(
      'read',
      [dom.create.parameter('io', buffer)],
      dom.type.boolean
    )
  );
  boolInterface.members.push(
    dom.create.method(
      'write',
      [
        dom.create.parameter('value', dom.type.boolean),
        dom.create.parameter('io', buffer)
      ],
      dom.type.void
    )
  );
  boolInterface.members.push(
    dom.create.method(
      'isValid',
      [dom.create.parameter('value', dom.type.boolean)],
      dom.type.boolean
    )
  );
  boolInterface.members.push(
    dom.create.method(
      'toXDR',
       [dom.create.parameter('value', dom.type.boolean)],
       buffer
      )
  );
  boolInterface.members.push(
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
      dom.type.boolean
    )
  );
  boolInterface.members.push(
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
      dom.type.boolean
    )
  );
  boolInterface.members.push(
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
      dom.type.boolean
    )
  );
  boolInterface.members.push(
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
      dom.type.boolean
    )
  );

  return boolInterface;
}
