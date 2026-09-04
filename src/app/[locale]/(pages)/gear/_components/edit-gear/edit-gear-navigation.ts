export interface GearEditSubmissionSuccess {
  autoApproved: boolean;
  proposalId?: string;
}

export function getGearEditSuccessPath(proposalId?: string): string {
  const query = new URLSearchParams();
  if (proposalId) query.set("id", proposalId);
  const search = query.toString();
  return search ? `/edit-success?${search}` : "/edit-success";
}

export function handleGearEditSubmissionSuccess({
  result,
  closeToGear,
  navigateToSuccess,
}: {
  result: GearEditSubmissionSuccess;
  closeToGear: () => void;
  navigateToSuccess: (href: string) => void;
}): void {
  if (result.autoApproved) {
    closeToGear();
    return;
  }

  navigateToSuccess(getGearEditSuccessPath(result.proposalId));
}
