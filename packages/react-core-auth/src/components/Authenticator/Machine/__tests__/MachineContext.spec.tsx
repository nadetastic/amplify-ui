import React from 'react';
import { renderHook } from '@testing-library/react-hooks';
import { NextAuthenticatorServiceFacade } from '@aws-amplify/ui';
import * as UIModule from '@aws-amplify/ui';

import * as utils from '../utils';

import {
  MachineProvider,
  useMachine,
  USE_MACHINE_ERROR,
} from '../MachineContext';

const mockServiceFacade: NextAuthenticatorServiceFacade = {
  challengeName: undefined,
  codeDeliveryDetails: undefined,
  errorMessage: undefined,
  federatedProviders: undefined,
  loginMechanism: 'username',
  isPending: false,
  route: 'idle',
  unverifiedContactMethods: { email: 'test#example.com' },
  totpSecretCode: undefined,
  resendCode: jest.fn(),
  setRoute: jest.fn(),
  submitForm: jest.fn(),
  toFederatedSignIn: jest.fn(),
  skipVerification: jest.fn(),
  username: undefined,
};

const getNextServiceFacadeSpy = jest
  .spyOn(UIModule, 'getNextServiceFacade')
  .mockReturnValue(mockServiceFacade);

// test setup
jest.mock('@xstate/react', () => ({
  ...jest.requireActual('@xstate/react'),
  useSelector: jest.fn((_, selector: () => NextAuthenticatorServiceFacade) =>
    selector()
  ),
}));

// mock `aws-amplify` to prevent logging auth errors during test runs
jest.mock('aws-amplify');

jest.mock('../utils');
const getComparatorSpy = jest.spyOn(utils, 'getComparator');

const Wrapper = ({ children }: { children?: React.ReactNode }) => (
  <MachineProvider>{children}</MachineProvider>
);

describe('useMachine', () => {
  beforeEach(() => {
    getComparatorSpy.mockClear();
    getNextServiceFacadeSpy.mockClear();
  });

  it('throws an error when used outside an MachineProvider', () => {
    const { result } = renderHook(useMachine);

    expect(result.error?.message).toBe(USE_MACHINE_ERROR);
  });

  it('returns the expected values', () => {
    const { result } = renderHook(useMachine, {
      wrapper: Wrapper,
    });

    expect(getNextServiceFacadeSpy).toHaveBeenCalled();

    expect(result.current).toMatchSnapshot();
  });

  it('calls getComparator with the selector argument', () => {
    const mockSelector = jest.fn();

    renderHook(() => useMachine(mockSelector), { wrapper: Wrapper });

    expect(getComparatorSpy).toHaveBeenLastCalledWith(mockSelector);
  });

  it('does not call getComparator when no selector argument passed', () => {
    renderHook(useMachine, { wrapper: Wrapper });

    expect(getComparatorSpy).not.toBeCalled();
  });
});
