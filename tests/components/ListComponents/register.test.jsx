import React from 'react';
import { render, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { getMechMinterContract } from 'common-util/Contracts';
import RegisterComponent from 'components/ListComponents/register';
import { FORM_NAME } from 'common-util/List/RegisterForm';
import { wrapProvider, dummyAddress, dummyHash } from '../../helpers';

const NEW_COMPONENT = { name: 'New Component One' };

jest.mock('common-util/Contracts', () => ({
  getMechMinterContract: jest.fn(),
}));

describe('listComponents/register.jsx', () => {
  it('should submit the form & register the `Component` successfully', async () => {
    expect.hasAssertions();

    getMechMinterContract.mockImplementation(() => ({
      methods: {
        create: jest.fn(() => ({
          send: jest.fn(() => Promise.resolve(NEW_COMPONENT)),
        })),
      },
    }));

    const { container, getByText, getByRole } = render(
      wrapProvider(<RegisterComponent />),
    );

    // title
    expect(getByText(/Register Component/i)).toBeInTheDocument();

    // check if submit button is present
    expect(
      getByRole('button', { name: 'Prefill Address' }),
    ).toBeInTheDocument();
    userEvent.type(
      container.querySelector(`#${FORM_NAME}_owner_address`),
      dummyAddress,
    );
    userEvent.type(container.querySelector(`#${FORM_NAME}_hash`), dummyHash);
    userEvent.type(
      container.querySelector(`#${FORM_NAME}_dependencies`),
      '1, 2',
    );

    const submitButton = getByRole('button', { name: 'Submit' });
    expect(submitButton).toBeInTheDocument();
    userEvent.click(submitButton);

    await waitFor(async () => {
      // check if `Component registered` on `Submit` click
      expect(getByText(/Component registered/i)).toBeInTheDocument();

      // Newly component info should also be displayed in AlertSuccess
      expect(getByText(/New Component One/i)).toBeInTheDocument();
    });
  });
});
