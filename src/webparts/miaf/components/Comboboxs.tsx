// ComboBoxVirtualizedExample.tsx

import * as React from 'react';
import { IComboBoxStyles, VirtualizedComboBox, IComboBoxOption, IComboBox } from '@fluentui/react';

const comboBoxStyles: Partial<IComboBoxStyles> = { root: { maxWidth: '600px' } };

export interface ComboBoxVirtualizedExampleProps {
  deger: IComboBoxOption[];
  onSelectedValueChange: (selectedValue: string) => void; 
}

export const ComboBoxVirtualizedExample: React.FunctionComponent<ComboBoxVirtualizedExampleProps> = ({ deger, onSelectedValueChange }) => {
  const [filteredOptions, setFilteredOptions] = React.useState<IComboBoxOption[]>(deger);

  const handleChange = (
    event: React.FormEvent<IComboBox>,
    option?: IComboBoxOption,
    index?: number,
    value?: string
  ) => { 
    const selectedValue = value || '';
    onSelectedValueChange(selectedValue);
  };

  const handleInputValueChange = (inputValue: string) => {
    // Giriş değerine göre seçenekleri filtrele
    const filtered = deger.filter((option) =>
      option.text.toLowerCase().indexOf(inputValue.toLowerCase()) !== -1
    );
    setFilteredOptions(filtered);
  };

  return (
    <VirtualizedComboBox
      allowFreeform  
      options={filteredOptions}
      dropdownMaxWidth={600}
      dropdownWidth={600}  
      styles={comboBoxStyles}
      onChange={handleChange}
      onInputValueChange={handleInputValueChange}
    />
  );
};
