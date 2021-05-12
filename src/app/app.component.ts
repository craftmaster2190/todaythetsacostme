import {Component} from '@angular/core';
import {AbstractControl, FormControl, FormGroup, Validators} from "@angular/forms";
import {HttpClient} from "@angular/common/http";
import {debounceTime, distinctUntilChanged, filter, map, shareReplay, switchMap, tap} from "rxjs/operators";
import Fuse from 'fuse.js'
import {filterTruthy} from "../util/filterTruthy";
import {CustomValidators} from "../util/CustomValidators";
import {truthy} from "../util/truthy";

export interface Airport {
  iata_code: string,
  name: string
};

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {

  constructor(private readonly http: HttpClient) {

  }

  public readonly dateFormControl = new FormControl(new Date(), [Validators.required]);
  public readonly itemFormControl = new FormControl('', [Validators.required]);
  public readonly amountFormControl = new FormControl('0.00', [Validators.required, Validators.min(0.01)]);
  public readonly airportFormControl = new FormControl('',
    [Validators.required, CustomValidators.typeofValue('object')]);
  private readonly airportsSubject = this.http.get<Array<Airport>>('/assets/us-airports.json').pipe(
    shareReplay(1));

  public readonly filteredAirports = this.airportFormControl.valueChanges.pipe(
    distinctUntilChanged(),
    filter(search => typeof search === 'string'),
    map(search => search.trim()),
    filterTruthy(),
    debounceTime(200),
    switchMap(search => this.airportsSubject.pipe(
      map(airports => new Fuse(airports, {
        includeScore: true,
        keys: [
          {
            name: 'iata_code',
            weight: 0.7
          },
          {
            name: 'name',
            weight: 0.3
          }
        ]
      }).search(search)
        .slice(0, 10)
        .map(result => result.item))
    ))
  )

  public commentFormControl = new FormControl('');

  public formGroup = new FormGroup({
    when: this.dateFormControl,
    where: this.airportFormControl,
    what: this.itemFormControl,
    howMuch: this.amountFormControl,
    comment: this.commentFormControl
  });

  public readonly key2Title = {
    when: "When?",
    where: "Which airport?",
    what: "What?",
    howMuch: "How Much?",
    comment: "Comment"
  }


  airportDisplayFunc(value?: Airport | string) {
    if (value) {
      if (typeof value === 'string') {
        return value;
      }
      return value.name
    }
    return "";
  }

  handleSubmit() {
    console.log(this.formGroup.value);
  }

  getTooltipText() {
    if (this.formGroup.valid) {
      return "Click to add your story!";
    }
    return Object.keys(this.formGroup.controls).map(key => {
      const errorString = this.getErrorString(this.formGroup.controls[key]);
      if (errorString) {
        return this.key2Title[key] + ": " + errorString
      }
    }).filter(truthy).join('\n')

    // return "Fill in all the fields."
  }

  getErrorString(formControl: AbstractControl) {
    if (formControl.hasError("required")) {
      return "Value is required";
    }
    if (formControl.hasError("min")) {
      return "Must have value greater than $0.00";
    }
    if (formControl.hasError("typeofValue")) {
      return "Must select specific airport";
    }
  }
}
