import * as React from 'react';
import * as Slot from '@radix-ui/react-slot';
import {
  Controller,
  type ControllerProps,
  type FieldValues,
  type UseFormProps,
} from 'react-hook-form';
import { cn } from '@/lib/utils';

const Form = React.forwardRef<
  HTMLFormElement,
  UseFormProps<FieldValues> & React.FormHTMLAttributes<HTMLFormElement>
>(({ ...props }, ref) => <form ref={ref} {...props} />);
Form.displayName = 'Form';

const FormField = <TFieldValues extends FieldValues = FieldValues>({
  ...props
}: ControllerProps<TFieldValues>) => {
  return <Controller {...props} />;
};

const FormItem = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('space-y-2', className)} {...props} />
  )
);
FormItem.displayName = 'FormItem';

const FormLabel = React.forwardRef<HTMLLabelElement, React.LabelHTMLAttributes<HTMLLabelElement>>(
  ({ className, ...props }, ref) => (
    <label
      ref={ref}
      className={cn(
        'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
        className
      )}
      {...props}
    />
  )
);
FormLabel.displayName = 'FormLabel';

const FormControl = React.forwardRef<
  React.ElementRef<typeof Slot.Slot>,
  React.ComponentPropsWithoutRef<typeof Slot.Slot>
>(({ className, ...props }, ref) => (
  <Slot.Slot ref={ref} className={cn('', className)} {...props} />
));
FormControl.displayName = 'FormControl';

const FormDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p ref={ref} className={cn('text-sm text-muted-foreground', className)} {...props} />
));
FormDescription.displayName = 'FormDescription';

const FormMessage = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, children, ...props }, ref) => (
  <p ref={ref} className={cn('text-sm font-medium text-destructive', className)} {...props}>
    {children}
  </p>
));
FormMessage.displayName = 'FormMessage';

export { Form, FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage };
export { useForm } from 'react-hook-form';
