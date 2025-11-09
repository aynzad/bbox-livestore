import { ChevronDown, CircleHelpIcon, XIcon } from 'lucide-react'
import * as React from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Separator } from '@/components/ui/separator'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

const NONE_OPTION_OPTION_VALUE = 'None'

interface Option {
  label: string
  value: string
  icon?: React.ComponentType<{ className?: string }>
  description?: string
}

/**
 * Props for MultiSelect component
 */
interface MultiSelectProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /**
   * An array of option objects to be displayed in the multi-select component.
   * Each option object has a label, value, and an optional icon.
   */
  options: Option[]

  /**
   * Callback function triggered when the selected values change.
   * Receives an array of the new selected values.
   */
  onValueChange: (value: string[]) => void

  /** The default selected values when the component mounts. */
  defaultValue?: string[]

  /**
   * Placeholder text to be displayed when no values are selected.
   * Optional, defaults to "Select options".
   */
  placeholder?: string

  /**
   * Maximum number of items to display. Extra selected items will be summarized.
   * Optional, defaults to 10.
   */
  maxCount?: number

  /**
   * The modality of the popover. When set to true, interaction with outside elements
   * will be disabled and only popover content will be visible to screen readers.
   * Optional, defaults to false.
   */
  modalPopover?: boolean

  /**
   * Additional class names to apply custom styles to the multi-select component.
   * Optional, can be used to add custom styles.
   */
  className?: string

  /**
   * The controlled selected values. If provided, the component is controlled.
   */
  value?: string[]

  /**
   * The name of the input for form integration.
   */
  name?: string

  /**
   * onBlur event handler for react-hook-form compatibility.
   */
  onBlur?: React.FocusEventHandler<any>
}

const OptionDescription = ({ description }: { description: string }) => (
  <Tooltip delayDuration={0}>
    <TooltipTrigger>
      <CircleHelpIcon />
    </TooltipTrigger>
    <TooltipContent side="right">{description}</TooltipContent>
  </Tooltip>
)

const Option = ({
  option,
  disabled,
  isSelected,
  onSelect,
}: {
  option: Option
  disabled: boolean
  isSelected: boolean
  onSelect: () => void
}) => (
  <CommandItem
    key={option.value}
    onSelect={onSelect}
    className="cursor-pointer"
    disabled={disabled}
  >
    <div
      className={cn(
        'mr-2 flex size-4 items-center justify-center [&_svg]:!text-current',
      )}
    >
      <Checkbox checked={isSelected} />
    </div>
    {option.icon && (
      <option.icon className="mr-2 size-4 text-muted-foreground" />
    )}
    <span>{option.label}</span>
    {option.description && (
      <OptionDescription description={option.description} />
    )}
  </CommandItem>
)

export const MultiSelect = React.forwardRef<HTMLInputElement, MultiSelectProps>(
  (
    {
      options,
      onValueChange,
      value,
      defaultValue = [],
      placeholder = 'Select options',
      maxCount = 10,
      modalPopover = false,
      className,
      name,
      onBlur,
      ...props
    },
    ref,
  ) => {
    const isControlled = value !== undefined
    const [internalValue, setInternalValue] =
      React.useState<string[]>(defaultValue)
    const [isPopoverOpen, setIsPopoverOpen] = React.useState(false)

    const selectedValues = isControlled ? value : internalValue

    // Arrange options: (None) on top if present
    const noneOption = options.find(
      (opt) => opt.value === NONE_OPTION_OPTION_VALUE,
    )
    const restOptions = options.filter(
      (opt) => opt.value !== NONE_OPTION_OPTION_VALUE,
    )

    // Determine selection state for disabling logic
    const isNoneSelected =
      !!noneOption && selectedValues.includes(NONE_OPTION_OPTION_VALUE)
    const isAnyOtherSelected = selectedValues.some(
      (val) => val !== NONE_OPTION_OPTION_VALUE,
    )

    const handleBlur = () => {
      onBlur?.({} as React.FocusEvent<any>)
    }

    const updateValue = (newValues: string[], shouldBlur = false) => {
      if (!isControlled) {
        setInternalValue(newValues)
      }
      onValueChange(newValues)

      if (shouldBlur) {
        handleBlur()
      }
    }

    const handleClear = () => {
      updateValue([], true)
    }

    const handleInputKeyDown = (
      event: React.KeyboardEvent<HTMLInputElement>,
    ) => {
      if (event.key === 'Enter') {
        setIsPopoverOpen(true)
      } else if (event.key === 'Backspace' && !event.currentTarget.value) {
        const newSelectedValues = [...selectedValues]
        newSelectedValues.pop()
        updateValue(newSelectedValues)
      }
    }

    const toggleOption = (option: string, shouldBlur = false) => {
      const newSelectedValues = selectedValues.includes(option)
        ? selectedValues.filter((oldValue) => oldValue !== option)
        : [...selectedValues, option]
      updateValue(newSelectedValues, shouldBlur)
    }

    const handleTogglePopover = () => {
      setIsPopoverOpen((prev) => !prev)
    }

    const clearExtraOptions = () => {
      const newSelectedValues = selectedValues.slice(0, maxCount)
      updateValue(newSelectedValues, true)
    }

    const toggleAll = () => {
      if (selectedValues.length === restOptions.length) {
        handleClear()
      } else {
        const allValues = restOptions.map((option) => option.value)
        updateValue(allValues)
      }
    }

    const handlePopoverOpenChange = (open: boolean) => {
      if (!open && onBlur) {
        onBlur({} as React.FocusEvent<any>)
      }
      setIsPopoverOpen(open)
    }

    return (
      <div aria-disabled={props.disabled} className="group">
        <Popover
          open={isPopoverOpen}
          onOpenChange={handlePopoverOpenChange}
          modal={modalPopover}
        >
          <PopoverTrigger asChild>
            <Button
              type="button"
              {...props}
              onClick={handleTogglePopover}
              aria-expanded={isPopoverOpen}
              className={cn(
                'h flex h-auto min-h-9 w-full items-center justify-between rounded-md border border-border bg-sub-layer-background p-0.5 transition-none hover:border-border hover:bg-sub-layer-background focus:border-primary focus:bg-sub-layer-background disabled:pointer-events-none aria-expanded:border-primary [&_svg]:pointer-events-auto',
                className,
              )}
            >
              {selectedValues.length > 0 ? (
                <div className="flex w-full items-center justify-between">
                  <div className="flex flex-wrap items-center gap-2 px-0.5">
                    {selectedValues.slice(0, maxCount).map((selectedValue) => {
                      const option = options.find(
                        (o) => o.value === selectedValue,
                      )
                      const IconComponent = option?.icon

                      return (
                        <Badge
                          key={selectedValue}
                          className="bg-card text-xs text-foreground transition-transform delay-150 duration-300 ease-in-out group-aria-disabled:opacity-30 hover:scale-110 hover:bg-card/80"
                        >
                          {IconComponent && (
                            <IconComponent className="mr-2 size-4" />
                          )}
                          {option?.label}
                          <Button
                            component="span"
                            variant="ghost"
                            className="h-2 w-2 cursor-pointer text-muted-foreground transition-colors group-aria-disabled:opacity-30 hover:text-error"
                            onClick={(event) => {
                              event.stopPropagation()
                              toggleOption(selectedValue, true)
                            }}
                          >
                            <XIcon />
                          </Button>
                        </Badge>
                      )
                    })}
                    {selectedValues.length > maxCount && (
                      <Badge className="bg-card text-xs text-foreground transition-transform delay-150 duration-300 ease-in-out hover:scale-110 hover:bg-card/80">
                        {`+ ${selectedValues.length - maxCount} more`}
                        <Button
                          variant="ghost"
                          className="ml-1 h-2 w-2 cursor-pointer text-muted-foreground transition-colors hover:text-error"
                          onClick={(event) => {
                            event.stopPropagation()
                            clearExtraOptions()
                          }}
                        >
                          <XIcon />
                        </Button>
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <XIcon
                      className="mx-2 h-4 cursor-pointer text-muted-foreground group-aria-disabled:pointer-events-none"
                      onClick={(event) => {
                        event.stopPropagation()
                        handleClear()
                      }}
                    />
                    <Separator
                      orientation="vertical"
                      className="flex h-full min-h-6"
                    />
                    <ChevronDown className="mx-2 h-4 cursor-pointer text-muted-foreground group-aria-disabled:pointer-events-none" />
                  </div>
                </div>
              ) : (
                <div className="mx-auto flex w-full items-center justify-between">
                  <span className="mx-3 text-xs text-muted-foreground">
                    {placeholder}
                  </span>
                  <ChevronDown className="mx-2 h-4 cursor-pointer text-muted-foreground group-aria-disabled:pointer-events-none" />
                </div>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent
            className="w-auto p-0"
            align="start"
            onEscapeKeyDown={() => setIsPopoverOpen(false)}
          >
            <Command>
              <CommandInput
                placeholder="Search..."
                onKeyDown={handleInputKeyDown}
              />
              <CommandList>
                <CommandEmpty>No results found.</CommandEmpty>
                <CommandGroup>
                  <Option
                    option={{
                      label: '(Select All)',
                      value: 'all',
                    }}
                    disabled={isNoneSelected}
                    isSelected={selectedValues.length === restOptions.length}
                    onSelect={toggleAll}
                  />
                  {noneOption && (
                    <Option
                      option={{
                        ...noneOption,
                        label: `(${noneOption.label})`,
                      }}
                      disabled={isAnyOtherSelected}
                      isSelected={isNoneSelected}
                      onSelect={() =>
                        !isAnyOtherSelected && toggleOption(noneOption.value)
                      }
                    />
                  )}
                  {restOptions.map((option) => (
                    <Option
                      key={option.value}
                      option={option}
                      disabled={isNoneSelected}
                      isSelected={selectedValues.includes(option.value)}
                      onSelect={() => toggleOption(option.value)}
                    />
                  ))}
                </CommandGroup>
                <CommandSeparator />
                <CommandGroup>
                  <div className="flex items-center justify-between">
                    <CommandItem
                      disabled={selectedValues.length === 0}
                      onSelect={handleClear}
                      className="flex-1 cursor-pointer justify-center"
                    >
                      Clear
                    </CommandItem>
                  </div>
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
        {/* Hidden input for form integration */}
        {name && (
          <input
            type="hidden"
            name={name}
            value={selectedValues.join(',')}
            ref={ref}
            data-testid="multiselect-hidden-input"
            readOnly
          />
        )}
      </div>
    )
  },
)

MultiSelect.displayName = 'MultiSelect'
