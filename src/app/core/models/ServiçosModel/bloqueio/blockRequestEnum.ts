export enum BlockReason {
  Loss = 'loss',
  Theft = 'theft',
  Robbery = 'robbery',
  UnauthorizedUse = 'unauthorized_use',
  DamagedCard = 'damaged_card',
  CardNotWorking = 'card_not_working',
  SecondCopy = 'second_copy',
  BenefitCancellation = 'benefit_cancellation',
  RegistrationChange = 'registration_change',
  Fraud = 'fraud',
  ExpiredCard = 'expired_card',
  Other = 'other'
}

export enum BlockStatus{
    EM_ANDAMENTO = 'pending',
    APROVADO = 'approved',
    REJEITADO = 'rejected'
}
