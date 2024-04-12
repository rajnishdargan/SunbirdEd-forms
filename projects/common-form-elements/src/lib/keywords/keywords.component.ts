import { Component, Input, OnChanges, OnDestroy, OnInit, SimpleChanges } from '@angular/core';
import { FormControl, UntypedFormGroup } from '@angular/forms';
import { CustomFormControl, DynamicFieldConfigOptionsBuilder, FieldConfig, FieldConfigOption } from '../common-form-config';
import * as _ from 'lodash-es';
import { merge, Observable, Subject, Subscription } from 'rxjs';
import { tap } from 'rxjs/operators';

@Component({
  selector: 'sb-keywords',
  templateUrl: './keywords.component.html',
  styleUrls: ['./keywords.component.css']
})
export class KeywordsComponent implements OnInit,OnChanges,OnDestroy {
  @Input() label: String;
  @Input() placeholder: String;
  @Input() formControlRef: CustomFormControl;
  @Input() field: FieldConfig<String>;
  @Input() validations?: any;
  @Input() disabled: Boolean;
  @Input() default: String;
  @Input() options: any;
  @Input() formGroup?: UntypedFormGroup;
  @Input() dataLoadStatusDelegate: Subject<'LOADING' | 'LOADED'>;
  @Input() depends?: any;
  public items: any;
  inputText = '';
  selectedItems:any;
  options$?: Observable<FieldConfigOption<any>[]>;
  contextValueChangesSubscription?: Subscription;
  latestParentValue: string;
  constructor() { }

  ngOnChanges(changes: SimpleChanges): void {
    console.log(this.options);

  }

  ngOnInit() {
    if (!_.isEmpty(this.default)) {
      this.items = this.default;
    }
    if(!_.isEmpty(this.field?.default)){
      this.selectedItems = this.field?.default;
    }

    if (!this.options) {
      this.options = _.isEmpty(this.field.options) ? this.isOptionsClosure(this.field.options) && this.field.options : [];
    }


    if (!_.isEmpty(this.field.depends)) {
      merge(..._.map(this.depends, depend => depend.valueChanges)).pipe(
          tap(() => {
            this.formControlRef.patchValue(null);
          })
      ).subscribe();
  }

  if (this.isOptionsClosure(this.options)) {
    // tslint:disable-next-line:max-line-length
    this.options$ = (this.options as DynamicFieldConfigOptionsBuilder<any>)(this.formControlRef, this.depends, this.formGroup, () => this.dataLoadStatusDelegate.next('LOADING'), () => this.dataLoadStatusDelegate.next('LOADED')) as any;
    this.contextValueChangesSubscription = this.options$.subscribe(
      (response: any) => {
        if (response && response.options) {
          this.field.options = response.options;
        } else {
          this.field.options = null;
        }
      }
    );
  }
  this.handleDependsWithDefault();

  }

  handleDependsWithDefault() {
    const value = _.first(_.map(this.depends, depend => depend.value));
    if (!_.isEmpty(value) && _.toLower(value) === 'yes') {
      this.formControlRef.isVisible = 'yes';
      this.field.options = this.formControlRef.options;
    } else {
        this.formControlRef.isVisible = 'no';
    }
  }

  ngOnDestroy(): void {
    if (this.contextValueChangesSubscription) {
      this.contextValueChangesSubscription.unsubscribe();
    }
  }

  onItemAdded(ev) {
    let fieldOptions = [];
    fieldOptions = this.field.options;
    const checkObject = fieldOptions.find(o => o.label === ev.label);
    if (!checkObject) {
    const obj = this.selectedItems.find(o => o.label === ev.label);
    obj.value =  'ECM_' + Date.now();
    }
    if (ev.label === ev.value) {
      const index = _.findIndex(this.selectedItems, (el) => el.value === ev.value);
      this.selectedItems.splice(index, 1);
      this.formControlRef.patchValue(this.selectedItems);
    }
  }

  isOptionsClosure(options: any) {
    return typeof options === 'function';
  }

}
