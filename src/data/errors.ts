export class SlugTakenError extends Error {
  constructor() {
    super('That slug is already used.')
  }
}

export class CategoryNotEmptyError extends Error {
  constructor() {
    super('This category still has products.')
  }
}

export class ApprovalBlockedError extends Error {
  issues: string[]
  constructor(issues: string[]) {
    super('Approval blocked')
    this.issues = issues
  }
}

export class OrderStateError extends Error {}
