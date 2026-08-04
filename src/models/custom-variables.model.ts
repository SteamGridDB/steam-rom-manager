interface SplitTitleMapping {
  DisplayTitle: string
  SortAsTitle: string
}

export interface CustomVariables {
  [group: string]: {
    [variable: string]: string | SplitTitleMapping;
  };
}
