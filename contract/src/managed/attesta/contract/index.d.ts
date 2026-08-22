import type * as __compactRuntime from '@midnight-ntwrk/compact-runtime';

export enum LivenessStatus { LIVE = 0, EXPIRED = 1, REVOKED = 2, NOT_TRUSTED = 3
}

export type Witnesses<PS> = {
  issuerSecret(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, Uint8Array];
  rawDataHash(context: __compactRuntime.WitnessContext<Ledger, PS>,
              ref_0: Uint8Array): [PS, Uint8Array];
  validFrom(context: __compactRuntime.WitnessContext<Ledger, PS>,
            ref_0: Uint8Array): [PS, bigint];
  validUntil(context: __compactRuntime.WitnessContext<Ledger, PS>,
             ref_0: Uint8Array): [PS, bigint];
  revocationSecret(context: __compactRuntime.WitnessContext<Ledger, PS>,
                   ref_0: Uint8Array): [PS, Uint8Array];
  attestationSalt(context: __compactRuntime.WitnessContext<Ledger, PS>,
                  ref_0: Uint8Array): [PS, Uint8Array];
  attestationMerklePath(context: __compactRuntime.WitnessContext<Ledger, PS>,
                        ref_0: Uint8Array): [PS, { leaf: Uint8Array,
                                                   path: { sibling: { field: bigint
                                                                    },
                                                           goes_left: boolean
                                                         }[]
                                                 }];
  issuerIdWitness(context: __compactRuntime.WitnessContext<Ledger, PS>,
                  ref_0: Uint8Array): [PS, Uint8Array];
  nullifierHashWitness(context: __compactRuntime.WitnessContext<Ledger, PS>,
                       ref_0: Uint8Array): [PS, Uint8Array];
}

export type ImpureCircuits<PS> = {
  registerAttestation(context: __compactRuntime.CircuitContext<PS>,
                      ref_0: Uint8Array): __compactRuntime.CircuitResults<PS, Uint8Array>;
  revokeAttestation(context: __compactRuntime.CircuitContext<PS>,
                    ref_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  proveLive(context: __compactRuntime.CircuitContext<PS>, ref_0: Uint8Array): __compactRuntime.CircuitResults<PS, [LivenessStatus,
                                                                                                                   Uint8Array]>;
  setTrustedIssuer(context: __compactRuntime.CircuitContext<PS>,
                   issuerId_0: Uint8Array,
                   trusted_0: boolean): __compactRuntime.CircuitResults<PS, []>;
}

export type ProvableCircuits<PS> = {
  registerAttestation(context: __compactRuntime.CircuitContext<PS>,
                      ref_0: Uint8Array): __compactRuntime.CircuitResults<PS, Uint8Array>;
  revokeAttestation(context: __compactRuntime.CircuitContext<PS>,
                    ref_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  proveLive(context: __compactRuntime.CircuitContext<PS>, ref_0: Uint8Array): __compactRuntime.CircuitResults<PS, [LivenessStatus,
                                                                                                                   Uint8Array]>;
  setTrustedIssuer(context: __compactRuntime.CircuitContext<PS>,
                   issuerId_0: Uint8Array,
                   trusted_0: boolean): __compactRuntime.CircuitResults<PS, []>;
}

export type PureCircuits = {
}

export type Circuits<PS> = {
  registerAttestation(context: __compactRuntime.CircuitContext<PS>,
                      ref_0: Uint8Array): __compactRuntime.CircuitResults<PS, Uint8Array>;
  revokeAttestation(context: __compactRuntime.CircuitContext<PS>,
                    ref_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  proveLive(context: __compactRuntime.CircuitContext<PS>, ref_0: Uint8Array): __compactRuntime.CircuitResults<PS, [LivenessStatus,
                                                                                                                   Uint8Array]>;
  setTrustedIssuer(context: __compactRuntime.CircuitContext<PS>,
                   issuerId_0: Uint8Array,
                   trusted_0: boolean): __compactRuntime.CircuitResults<PS, []>;
}

export type Ledger = {
  attestations: {
    isFull(): boolean;
    checkRoot(rt_0: { field: bigint }): boolean;
    root(): __compactRuntime.MerkleTreeDigest;
    firstFree(): bigint;
    pathForLeaf(index_0: bigint, leaf_0: Uint8Array): __compactRuntime.MerkleTreePath<Uint8Array>;
    findPathForLeaf(leaf_0: Uint8Array): __compactRuntime.MerkleTreePath<Uint8Array> | undefined;
    history(): Iterator<__compactRuntime.MerkleTreeDigest>
  };
  revokedNullifiers: {
    isEmpty(): boolean;
    size(): bigint;
    member(key_0: Uint8Array): boolean;
    lookup(key_0: Uint8Array): boolean;
    [Symbol.iterator](): Iterator<[Uint8Array, boolean]>
  };
  trustedIssuers: {
    isEmpty(): boolean;
    size(): bigint;
    member(key_0: Uint8Array): boolean;
    lookup(key_0: Uint8Array): boolean;
    [Symbol.iterator](): Iterator<[Uint8Array, boolean]>
  };
}

export type ContractReferenceLocations = any;

export declare const contractReferenceLocations : ContractReferenceLocations;

export declare class Contract<PS = any, W extends Witnesses<PS> = Witnesses<PS>> {
  witnesses: W;
  circuits: Circuits<PS>;
  impureCircuits: ImpureCircuits<PS>;
  provableCircuits: ProvableCircuits<PS>;
  constructor(witnesses: W);
  initialState(context: __compactRuntime.ConstructorContext<PS>): __compactRuntime.ConstructorResult<PS>;
}

export declare function ledger(state: __compactRuntime.StateValue | __compactRuntime.ChargedState): Ledger;
export declare const pureCircuits: PureCircuits;
