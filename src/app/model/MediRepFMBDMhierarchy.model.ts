export class MediRepFMBDMhierarchy {
  constructor(
    public BusinessUnit: string,
    public ExecutiveCode: string,
    public ExecutiveGroup: string,
    public ParentGroup: string,
    public ParentExecutive: string,
    public FromDate: Date,
    public Todate: Date,
    public EndDate: Date,
    public Active: string,
    public HiddenVal: string
  ) {}
}
