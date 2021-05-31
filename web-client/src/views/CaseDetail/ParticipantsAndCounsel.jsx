import { AddressDisplay } from './AddressDisplay';
import { Button } from '../../ustc-ui/Button/Button';
import { PartiesInformationContentHeader } from './PartiesInformationContentHeader';
import { connect } from '@cerebral/react';
import { state } from 'cerebral';
import React from 'react';

const ParticipantsAndCounsel = connect(
  {
    caseDetail: state.caseDetail,
    caseInformationHelper: state.caseInformationHelper,
    partiesInformationHelper: state.partiesInformationHelper,
  },
  function ParticipantsAndCounsel({
    caseDetail,
    caseInformationHelper,
    partiesInformationHelper,
  }) {
    return (
      <>
        <PartiesInformationContentHeader title="Intervenor/Participant(s)" />
        <div className="grid-row grid-gap-2">
          {partiesInformationHelper.formattedParticipants.map(petitioner => (
            <div
              className="tablet:grid-col-9 mobile:grid-col-9 desktop:grid-col-4 margin-bottom-4"
              key={petitioner.contactId}
            >
              <div className="card height-full margin-bottom-0">
                <div className="content-wrapper parties-card">
                  <h3 className="text-wrap">
                    {petitioner.name}
                    {petitioner.canEditPetitioner && (
                      <Button
                        link
                        className="edit-participant width-auto margin-top-1 margin-left-1 padding-0 margin-right-0 float-right"
                        href={`/case-detail/${caseDetail.docketNumber}/edit-petitioner-information/${petitioner.contactId}`}
                        icon="edit"
                        overrideMargin={true}
                      >
                        Edit
                      </Button>
                    )}
                  </h3>
                  <div className="bg-primary text-white padding-1 margin-bottom-2">
                    {petitioner.formattedTitle}
                  </div>
                  <AddressDisplay
                    contact={{
                      ...petitioner,
                      name: undefined,
                    }}
                    showEmail={true}
                  />
                  {petitioner.serviceIndicator && (
                    <div className="margin-top-4">
                      <p className="semi-bold margin-bottom-0">
                        Service preference
                      </p>
                      {petitioner.serviceIndicator}
                    </div>
                  )}
                  <h4 className="margin-top-3">Counsel</h4>
                  {petitioner.hasCounsel &&
                    petitioner.representingPractitioners.map(
                      privatePractitioner => (
                        <p key={privatePractitioner.userId}>
                          <span className="grid-row">
                            <span className="grid-col-9">
                              {privatePractitioner.name}{' '}
                              {`(${privatePractitioner.barNumber})`}{' '}
                            </span>
                            <span className="grid-col-3">
                              {caseInformationHelper.showEditPrivatePractitioners && (
                                <Button
                                  link
                                  className="margin-left-1 padding-0 height-3"
                                  href={`/case-detail/${caseDetail.docketNumber}/edit-petitioner-counsel/${privatePractitioner.barNumber}`}
                                  icon="edit"
                                  overrideMargin={true}
                                >
                                  Edit
                                </Button>
                              )}
                              {caseInformationHelper.showViewCounselButton && (
                                <Button
                                  link
                                  className="margin-left-1 padding-0"
                                  href={`/case-detail/${caseDetail.docketNumber}/edit-petitioner-counsel/${privatePractitioner.barNumber}`}
                                  icon="eye"
                                  overrideMargin={true}
                                >
                                  View
                                </Button>
                              )}
                            </span>
                          </span>
                          <span className="address-line">
                            {privatePractitioner.email}
                          </span>
                          <span className="address-line">
                            {privatePractitioner.contact.phone}
                          </span>
                        </p>
                      ),
                    )}
                  {!petitioner.hasCounsel && 'None'}
                </div>
              </div>
            </div>
          ))}
        </div>
      </>
    );
  },
);

export { ParticipantsAndCounsel };