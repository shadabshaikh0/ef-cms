import { BindedSelect } from '../../ustc-ui/BindedSelect/BindedSelect';
import { Button } from '../../ustc-ui/Button/Button';
import { DateInput } from '../../ustc-ui/DateInput/DateInput';
import { FormGroup } from '../../ustc-ui/FormGroup/FormGroup';
import { Mobile, NonMobile } from '../../ustc-ui/Responsive/Responsive';
import { connect } from '@cerebral/react';
import { sequences, state } from 'cerebral';
import React from 'react';

export const AdvancedDocumentSearch = connect(
  {
    clearAdvancedSearchFormSequence: sequences.clearAdvancedSearchFormSequence,
    opinionDocumentTypes: state.opinionDocumentTypes,
  },
  function AdvancedDocumentSearch({
    clearAdvancedSearchFormSequence,
    form,
    formType,
    judges,
    opinionDocumentTypes,
    updateSequence,
    validateSequence,
    validationErrors,
  }) {
    return (
      <>
        <NonMobile>
          <div className="grid-col" id="document-advanced">
            <h4>Narrow your search (optional)</h4>
            <FormGroup
              className="margin-bottom-0"
              errorText={validationErrors.chooseOneValue}
            >
              <div className="grid-row">
                <div className="grid-col-3">
                  <label className="usa-label" htmlFor="docket-number">
                    Docket number
                  </label>
                  <input
                    className="usa-input"
                    id="docket-number"
                    name="docketNumber"
                    type="text"
                    value={form.docketNumber || ''}
                    onBlur={() => validateSequence()}
                    onChange={e => {
                      updateSequence({
                        key: e.target.name,
                        value: e.target.value,
                      });
                    }}
                  />
                </div>
                <div className="grid-col-2">
                  <div className="text-center padding-top-6">or</div>
                </div>
                <div className="grid-col-7">
                  <label className="usa-label" htmlFor="title-or-name">
                    Case title / Petitioner’s name
                  </label>
                  <input
                    className="usa-input"
                    id="title-or-name"
                    name="caseTitleOrPetitioner"
                    type="text"
                    value={form.caseTitleOrPetitioner || ''}
                    onBlur={() => validateSequence()}
                    onChange={e => {
                      updateSequence({
                        key: e.target.name,
                        value: e.target.value,
                      });
                    }}
                  />
                </div>
              </div>
            </FormGroup>
            <FormGroup>
              {formType === 'opinionSearch' && (
                <div className="grid-row opinion-type-search-row">
                  <label
                    className="usa-label padding-top-105"
                    htmlFor="order-opinion"
                  >
                    Opinion type
                  </label>
                  <select
                    className="usa-input usa-select"
                    id="order-opinion"
                    name="opinionType"
                    onChange={e => {
                      updateSequence({
                        key: e.target.name,
                        value: e.target.value,
                      });
                    }}
                  >
                    <option value="">- Select -</option>
                    {opinionDocumentTypes.map((opinionType, idx) => (
                      <option key={idx} value={opinionType}>
                        {opinionType}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div className="grid-row judge-search-row">
                <label
                  className="usa-label padding-top-105"
                  htmlFor="order-judge"
                >
                  Judge
                </label>
                <BindedSelect
                  bind={`advancedSearchForm.${formType}.judge`}
                  className="usa-input"
                  id="order-judge"
                  name="judge"
                >
                  <option value="">- Select -</option>
                  {judges.map((judge, idx) => (
                    <option key={idx} value={judge.judgeFullName}>
                      {judge.name}
                    </option>
                  ))}
                </BindedSelect>
              </div>
              <div className="grid-row date-search-row">
                <div className="grid-container padding-top-2 padding-left-0 padding-right-0 margin-left-0 margin-right-0">
                  <FormGroup>
                    <div className="grid-row">
                      <div className="grid-col-5">
                        <DateInput
                          errorText={
                            validationErrors.dateRangeRequired ||
                            validationErrors.startDate
                          }
                          id="start-date"
                          label="Start Date"
                          names={{
                            day: 'startDateDay',
                            month: 'startDateMonth',
                            year: 'startDateYear',
                          }}
                          values={{
                            day: form.startDateDay,
                            month: form.startDateMonth,
                            year: form.startDateYear,
                          }}
                          onBlur={validateSequence}
                          onChange={updateSequence}
                        />
                      </div>
                      <div className="grid-col-2 padding-left-1">
                        <div className="text-center padding-top-6">to</div>
                      </div>
                      <div className="grid-col-5">
                        <DateInput
                          optional
                          errorText={
                            validationErrors.dateRangeRequired ||
                            validationErrors.endDate
                          }
                          id="end-date"
                          label="End Date"
                          names={{
                            day: 'endDateDay',
                            month: 'endDateMonth',
                            year: 'endDateYear',
                          }}
                          values={{
                            day: form.endDateDay,
                            month: form.endDateMonth,
                            year: form.endDateYear,
                          }}
                          onBlur={validateSequence}
                          onChange={updateSequence}
                        />
                      </div>
                    </div>
                  </FormGroup>
                </div>
              </div>
            </FormGroup>
          </div>
        </NonMobile>

        <Mobile>
          <div className="grid-row" id="document-advanced">
            <h4>Narrow your search (optional)</h4>
            <FormGroup
              className="margin-bottom-0"
              errorText={validationErrors.chooseOneValue}
            >
              <div className="grid-row">
                <div className="grid-col-3">
                  <label className="usa-label" htmlFor="docket-number">
                    Docket number
                  </label>
                  <input
                    className="usa-input"
                    id="docket-number"
                    name="docketNumber"
                    type="text"
                    value={form.docketNumber || ''}
                    onBlur={() => validateSequence()}
                    onChange={e => {
                      updateSequence({
                        key: e.target.name,
                        value: e.target.value,
                      });
                    }}
                  />
                </div>
                <div className="grid-col-2">
                  <div className="text-center padding-top-6">or</div>
                </div>
                <div className="grid-col-7">
                  <label className="usa-label" htmlFor="title-or-name">
                    Case title / Petitioner’s name
                  </label>
                  <input
                    className="usa-input"
                    id="title-or-name"
                    name="caseTitleOrPetitioner"
                    type="text"
                    value={form.caseTitleOrPetitioner || ''}
                    onBlur={() => validateSequence()}
                    onChange={e => {
                      updateSequence({
                        key: e.target.name,
                        value: e.target.value,
                      });
                    }}
                  />
                </div>
              </div>
            </FormGroup>
            <FormGroup>
              {formType === 'opinionSearch' && (
                <div className="grid-row opinion-type-search-row">
                  <label
                    className="usa-label padding-top-105"
                    htmlFor="order-opinion"
                  >
                    Opinion type
                  </label>
                  <select
                    className="usa-input usa-select"
                    id="order-opinion"
                    name="opinionType"
                    onChange={e => {
                      updateSequence({
                        key: e.target.name,
                        value: e.target.value,
                      });
                    }}
                  >
                    <option value="">- Select -</option>
                    {opinionDocumentTypes.map((opinionType, idx) => (
                      <option key={idx} value={opinionType}>
                        {opinionType}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div className="grid-row judge-search-row">
                <label
                  className="usa-label padding-top-105"
                  htmlFor="order-judge"
                >
                  Judge
                </label>
                <select
                  className="usa-input usa-select"
                  id="order-judge"
                  name="judge"
                  onChange={e => {
                    updateSequence({
                      key: e.target.name,
                      value: e.target.value,
                    });
                  }}
                >
                  <option value="">- Select -</option>
                  {judges.map((judge, idx) => (
                    <option key={idx} value={judge.judgeFullName}>
                      {judge.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid-row date-search-row">
                <div className="grid-container padding-top-2 padding-left-0 padding-right-0 margin-left-0 margin-right-0">
                  <FormGroup>
                    <div className="grid-row">
                      <DateInput
                        errorText={
                          validationErrors.dateRangeRequired ||
                          validationErrors.startDate
                        }
                        id="start-date"
                        label="Start Date"
                        names={{
                          day: 'startDateDay',
                          month: 'startDateMonth',
                          year: 'startDateYear',
                        }}
                        values={{
                          day: form.startDateDay,
                          month: form.startDateMonth,
                          year: form.startDateYear,
                        }}
                        onBlur={validateSequence}
                        onChange={updateSequence}
                      />
                    </div>
                    <div className="grid-row">
                      <div className="text-center padding-top-2 padding-bottom-2">
                        to
                      </div>
                    </div>
                    <div className="grid-row">
                      <DateInput
                        optional
                        errorText={
                          validationErrors.dateRangeRequired ||
                          validationErrors.endDate
                        }
                        id="end-date"
                        label="End Date"
                        names={{
                          day: 'endDateDay',
                          month: 'endDateMonth',
                          year: 'endDateYear',
                        }}
                        values={{
                          day: form.endDateDay,
                          month: form.endDateMonth,
                          year: form.endDateYear,
                        }}
                        onBlur={validateSequence}
                        onChange={updateSequence}
                      />
                    </div>
                  </FormGroup>
                </div>
              </div>
            </FormGroup>

            <div className="grid-row">
              <div className="grid-col-12">
                <Button
                  className="margin-bottom-0"
                  id="advanced-search-button"
                  type="submit"
                >
                  Search
                </Button>
                <Button
                  link
                  className="ustc-button--mobile-inline"
                  onClick={e => {
                    e.preventDefault();
                    clearAdvancedSearchFormSequence({
                      formType,
                    });
                  }}
                >
                  Clear Search
                </Button>
              </div>
            </div>
          </div>
        </Mobile>
      </>
    );
  },
);
